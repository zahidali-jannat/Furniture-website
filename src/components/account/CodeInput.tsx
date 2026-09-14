"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Six digits, six cells.
 *
 * The awkward parts of this pattern are the ones that get skipped, so they are
 * all here: pasting the whole code into any cell fills every cell; backspace on
 * an empty cell steps back and clears the one before; the arrow keys move
 * without editing; a phone gets a numeric keypad and the platform's own SMS
 * autofill through `autocomplete="one-time-code"`, which only works on the
 * first field and only if it is a real input.
 *
 * Non-digits are dropped rather than shown in red. There is no case where
 * typing a letter into an SMS code is a thing the person meant.
 */
export default function CodeInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  label: string;
}) {
  const cells = useRef<(HTMLInputElement | null)[]>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const digits = value.padEnd(6, " ").slice(0, 6).split("");

  // Fires once when the sixth digit lands, whether typed or pasted.
  const fired = useRef(false);
  useEffect(() => {
    if (value.length === 6 && !fired.current) {
      fired.current = true;
      onComplete?.(value);
    }
    if (value.length < 6) fired.current = false;
  }, [value, onComplete]);

  function write(next: string, caret: number) {
    onChange(next.slice(0, 6));
    const target = Math.min(Math.max(caret, 0), 5);
    cells.current[target]?.focus();
  }

  function onCellChange(index: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;

    // A paste, or an autofilled code, arrives as one long string in one cell.
    if (typed.length > 1) {
      write((value.slice(0, index) + typed).slice(0, 6), index + typed.length);
      return;
    }

    const next = value.padEnd(index, " ").slice(0, index) + typed + value.slice(index + 1);
    write(next.replace(/\s/g, ""), index + 1);
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (value[index]) {
        write(value.slice(0, index) + value.slice(index + 1), index);
      } else {
        write(value.slice(0, Math.max(0, index - 1)) + value.slice(index), index - 1);
      }
    }
    if (event.key === "ArrowLeft") cells.current[index - 1]?.focus();
    if (event.key === "ArrowRight") cells.current[index + 1]?.focus();
  }

  return (
    <div
      role="group"
      aria-label={label}
      className="flex gap-2.5 sm:gap-3"
      onPaste={(event) => {
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        event.preventDefault();
        write(pasted, pasted.length);
      }}
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            cells.current[index] = el;
          }}
          value={digit.trim()}
          onChange={(event) => onCellChange(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onFocus={() => setFocused(index)}
          onBlur={() => setFocused(null)}
          disabled={disabled}
          inputMode="numeric"
          // The platform only offers the code to the first field of the group.
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={6}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid}
          className={[
            "h-14 w-full min-w-0 border-b bg-transparent text-center text-[1.35rem] text-charcoal",
            "transition-colors duration-500 focus:outline-none disabled:opacity-40",
            invalid
              ? "border-clay"
              : focused === index
                ? "border-charcoal"
                : "border-charcoal/20",
          ].join(" ")}
          style={{ transitionTimingFunction: "var(--ease-lux)" }}
        />
      ))}
    </div>
  );
}
