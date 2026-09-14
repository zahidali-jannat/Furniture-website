/**
 * The one way the account forms talk to the server.
 *
 * Every route answers in the same shape — `{ ok: true, … }` or
 * `{ ok: false, error, fields?, code? }` — so this can hand a component either
 * its data or a sentence and a map of field errors, and no form has to know
 * about status codes.
 *
 * `credentials: "same-origin"` is explicit rather than assumed: the session
 * cookies are httpOnly and there is nothing for the JavaScript to attach by
 * hand, so a fetch that forgets to send them fails in a way that looks like a
 * signed-out session.
 */

export type Failure = {
  ok: false;
  error: string;
  fields?: Record<string, string>;
  code?: string;
  status: number;
};

export type Result<T> = ({ ok: true } & T) | Failure;

async function request<T>(url: string, init: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(url, {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...init,
    });

    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok || data.ok === false) {
      return {
        ok: false,
        status: res.status,
        error: typeof data.error === "string" ? data.error : "Something went wrong. Please try again.",
        fields: (data.fields as Record<string, string>) ?? undefined,
        code: typeof data.code === "string" ? data.code : undefined,
      };
    }

    return data as { ok: true } & T;
  } catch {
    // Offline, a dropped connection, a page navigating away mid-request.
    return {
      ok: false,
      status: 0,
      error: "We could not reach the server. Check your connection and try again.",
    };
  }
}

export function post<T>(url: string, body: unknown) {
  return request<T>(url, { method: "POST", body: JSON.stringify(body) });
}

export function patch<T>(url: string, body: unknown) {
  return request<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}

export function get<T>(url: string) {
  return request<T>(url, { method: "GET" });
}

export function del<T>(url: string) {
  return request<T>(url, { method: "DELETE" });
}
