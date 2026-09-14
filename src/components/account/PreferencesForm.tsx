"use client";

import { useState } from "react";
import { FormNotice } from "./FormBits";
import { patch } from "@/lib/client/api";

type Preferences = {
  enquiryUpdates: boolean;
  consultationReminders: boolean;
  productUpdates: boolean;
  newCollections: boolean;
  promotions: boolean;
  preferredChannel: "email" | "phone";
};

type Description = {
  key: keyof Omit<Preferences, "preferredChannel">;
  label: string;
  blurb: string;
  transactional?: boolean;
};

/**
 * What we may write about.
 *
 * Each switch saves on its own the moment it is flipped — no Save button to
 * forget, and no way to withdraw consent and have it quietly not stick. The
 * change is shown immediately and put back if the server refuses, which is the
 * one case where optimism is wrong to leave standing.
 *
 * Only the changed field is sent. A page open in another tab cannot then
 * re-consent to four other things with values it loaded an hour ago.
 */
export default function PreferencesForm({
  initial,
  descriptions,
  canText,
}: {
  initial: Preferences;
  descriptions: Description[];
  /** False when no SMS gateway exists, so "by telephone" would be a promise we cannot keep. */
  canText: boolean;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function change(field: keyof Preferences, value: boolean | string) {
    const previous = prefs;
    setPrefs({ ...prefs, [field]: value } as Preferences);
    setBusy(field);
    setError(null);
    setSaved(null);

    const result = await patch<{ preferences: Preferences }>("/api/account/preferences", {
      [field]: value,
    });

    setBusy(null);

    if (!result.ok) {
      setPrefs(previous);
      setError(result.error);
      return;
    }

    setPrefs(result.preferences);
    setSaved("Saved.");
  }

  return (
    <div className="max-w-2xl">
      <ul className="border-t border-charcoal/12">
        {descriptions.map((item) => (
          <li
            key={item.key}
            className="flex items-start justify-between gap-8 border-b border-charcoal/8 py-5"
          >
            <div className="min-w-0">
              <p className="text-[1rem] text-charcoal">{item.label}</p>
              <p className="mt-1.5 max-w-md text-[0.9rem] leading-relaxed text-charcoal/70">
                {item.blurb}
                {item.transactional && " These answer something you started."}
              </p>
            </div>

            <Switch
              label={item.label}
              on={prefs[item.key]}
              busy={busy === item.key}
              onChange={(value) => change(item.key, value)}
            />
          </li>
        ))}
      </ul>

      <fieldset className="mt-10">
        <legend className="eyebrow text-[0.7rem] text-charcoal/65">
          How we should reach you
        </legend>

        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
          {(["email", "phone"] as const).map((channel) => {
            const disabled = channel === "phone" && !canText;
            return (
              <label
                key={channel}
                className={[
                  "flex items-center gap-3 text-[0.96rem] transition-opacity duration-500",
                  disabled ? "cursor-not-allowed opacity-35" : "cursor-pointer",
                  prefs.preferredChannel === channel ? "text-charcoal" : "text-charcoal/75",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="preferredChannel"
                  value={channel}
                  checked={prefs.preferredChannel === channel}
                  disabled={disabled || busy === "preferredChannel"}
                  onChange={() => change("preferredChannel", channel)}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={[
                    "block h-1.5 w-1.5 rounded-full border border-charcoal/40 transition-colors duration-500",
                    prefs.preferredChannel === channel ? "bg-charcoal" : "bg-transparent",
                  ].join(" ")}
                />
                {channel === "email" ? "By email" : "By telephone"}
              </label>
            );
          })}
        </div>

        {!canText && (
          <p className="mt-3 text-[0.85rem] leading-relaxed text-charcoal/65">
            Telephone is unavailable while text messaging is not set up on this server.
          </p>
        )}
      </fieldset>

      <div className="mt-8">
        <FormNotice error={error} success={saved} />
      </div>

      <p className="mt-2 max-w-md text-[0.85rem] leading-relaxed text-charcoal/65">
        Everything promotional is off until you turn it on. You can change any of this whenever
        you like, and every message we send carries a way back here.
      </p>
    </div>
  );
}

/**
 * The switch.
 *
 * A real checkbox underneath, so it is reachable by keyboard, announced
 * correctly, and toggled by the space bar like any other. The line and the
 * dot are only what it looks like.
 */
function Switch({
  label,
  on,
  busy,
  onChange,
}: {
  label: string;
  on: boolean;
  busy: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="group relative mt-1 shrink-0 cursor-pointer">
      <input
        type="checkbox"
        checked={on}
        disabled={busy}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={[
          "block h-[1.35rem] w-11 rounded-full border transition-colors duration-500",
          "peer-focus-visible:ring-1 peer-focus-visible:ring-charcoal peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bone",
          on ? "border-charcoal/70 bg-charcoal/85" : "border-charcoal/25 bg-transparent",
          busy ? "opacity-50" : "",
        ].join(" ")}
        style={{ transitionTimingFunction: "var(--ease-lux)" }}
      />
      <span
        aria-hidden="true"
        className={[
          "absolute top-1/2 block h-3 w-3 -translate-y-1/2 rounded-full transition-all duration-500",
          on ? "left-[1.65rem] bg-bone" : "left-[0.3rem] bg-charcoal/40",
        ].join(" ")}
        style={{ transitionTimingFunction: "var(--ease-lux)" }}
      />
    </label>
  );
}
