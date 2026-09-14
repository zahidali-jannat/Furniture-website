"use client";

import { useId, useState } from "react";

/**
 * A text field, drawn as a rule rather than a box.
 *
 * The label sits above the line at all times instead of floating inside it.
 * Placeholder-as-label looks tidy in a screenshot and is a nuisance in use —
 * it vanishes exactly when you want to check what you typed, and it reads as
 * filled-in to a screen reader. A rule, a small label and real space between
 * fields is the older and better answer.
 */
export function Field({
  label,
  name,
  type = "text",
  error,
  hint,
  ...rest
}: {
  label: string;
  name: string;
  type?: string;
  error?: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type">) {
  const id = useId();
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="group">
      <label
        htmlFor={id}
        className="eyebrow block text-[0.625rem] tracking-[0.22em] text-charcoal/45"
      >
        {label}
      </label>

      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy || undefined}
        {...rest}
        className={[
          "mt-2 w-full border-b bg-transparent pb-2.5 text-[0.95rem] text-charcoal",
          "placeholder:text-charcoal/25 focus:outline-none disabled:opacity-50",
          "transition-colors duration-500",
          error ? "border-clay" : "border-charcoal/20 focus:border-charcoal",
        ].join(" ")}
        style={{ transitionTimingFunction: "var(--ease-lux)" }}
      />

      <FieldNote id={id} error={error} hint={hint} />
    </div>
  );
}

/**
 * The same field with a reveal control.
 *
 * Typing a long password blind is how people end up choosing short ones, so
 * the eye is there — but it is a button, it announces its state, and it never
 * starts revealed.
 */
export function PasswordField({
  label,
  name,
  error,
  hint,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name" | "type">) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label
        htmlFor={id}
        className="eyebrow block text-[0.625rem] tracking-[0.22em] text-charcoal/45"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={name}
          type={shown ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy || undefined}
          {...rest}
          className={[
            "mt-2 w-full border-b bg-transparent pb-2.5 pr-12 text-[0.95rem] text-charcoal",
            "placeholder:text-charcoal/25 focus:outline-none disabled:opacity-50",
            "transition-colors duration-500",
            error ? "border-clay" : "border-charcoal/20 focus:border-charcoal",
          ].join(" ")}
          style={{ transitionTimingFunction: "var(--ease-lux)" }}
        />

        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-pressed={shown}
          className="absolute bottom-2.5 right-0 eyebrow text-[0.6rem] text-charcoal/40 transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:text-charcoal"
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>

      <FieldNote id={id} error={error} hint={hint} />
    </div>
  );
}

function FieldNote({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  // The row is always present so a message appearing does not shove the rest
  // of the form down the page.
  return (
    <div className="min-h-[1.15rem] pt-1.5">
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[0.72rem] leading-snug text-clay">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[0.72rem] leading-snug text-charcoal/40">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
