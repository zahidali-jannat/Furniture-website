"use client";

import { useEffect, useState } from "react";
import { QuietButton } from "./Buttons";
import { FormNotice } from "./FormBits";
import { del, get } from "@/lib/client/api";

type Device = {
  id: string;
  device: string;
  ip: string | null;
  startedAt: string;
  lastUsedAt: string;
};

/**
 * Where this account is signed in.
 *
 * Fetched by the browser rather than rendered on the server, because the list
 * changes while you are looking at it — signing out everywhere has to show its
 * own effect. It is also the one part of the account that nobody needs on the
 * first paint.
 */
export default function SessionsPanel() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function load() {
    const result = await get<{ items: Device[] }>("/api/account/sessions");
    if (result.ok) setDevices(result.items);
    else setError(result.error);
  }

  useEffect(() => {
    let alive = true;

    // Written out rather than calling load(): state is only touched once the
    // request has come back, never synchronously inside the effect.
    get<{ items: Device[] }>("/api/account/sessions").then((result) => {
      if (!alive) return;
      if (result.ok) setDevices(result.items);
      else setError(result.error);
    });

    return () => {
      alive = false;
    };
  }, []);

  async function signOutEverywhere() {
    if (busy) return;
    setBusy(true);
    setError(null);
    setDone(null);

    const result = await del("/api/account/sessions");
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setDone("Every other device has been signed out.");
    load();
  }

  return (
    <div className="max-w-xl">
      {devices === null ? (
        <p className="text-[0.92rem] text-charcoal/65">Looking…</p>
      ) : devices.length === 0 ? (
        <p className="text-[0.92rem] text-charcoal/70">No other devices.</p>
      ) : (
        <ul className="border-t border-charcoal/8">
          {devices.map((device) => (
            <li
              key={device.id}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-charcoal/8 py-3.5"
            >
              <span className="text-[0.95rem] text-charcoal/80">{device.device}</span>
              <span className="text-[0.82rem] text-charcoal/65">
                last used{" "}
                {new Date(device.lastUsedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
                {device.ip && device.ip !== "unknown" ? ` · ${device.ip}` : ""}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-7">
        <FormNotice error={error} success={done} />
      </div>

      <div className="mt-4">
        <QuietButton type="button" onClick={signOutEverywhere} busy={busy}>
          Sign out everywhere else
        </QuietButton>
      </div>
    </div>
  );
}
