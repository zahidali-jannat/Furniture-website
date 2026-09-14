"use client";

/**
 * How the password is doing, as four short rules rather than a bar.
 *
 * A coloured meter invites people to stop at "good", and the number behind it
 * is usually invented. These are the actual conditions the server will apply,
 * shown as they are met, so nothing is refused after the fact for a reason the
 * visitor could not see.
 */
export default function PasswordMeter({
  password,
  confirm,
  context = [],
}: {
  password: string;
  confirm?: string;
  context?: string[];
}) {
  const lowered = password.toLowerCase();

  // With nothing typed yet the rules are shown unmet rather than the component
  // collapsing: the list is what tells someone what is expected before they
  // choose, and a block that appears on the first keystroke shoves the button
  // down the page under their thumb.
  const started = password.length > 0;

  const rules = [
    { label: "Ten characters or more", met: started && password.length >= 10 },
    {
      label: "Not your name or address",
      met: started && !context.some((c) => c.length >= 4 && lowered.includes(c.toLowerCase())),
    },
    { label: "More than one character repeated", met: started && !/^(.)\1+$/.test(password) },
    ...(confirm !== undefined
      ? [{ label: "Both entries match", met: started && confirm.length > 0 && password === confirm }]
      : []),
  ];

  return (
    <ul className="grid gap-1.5 pt-1 sm:grid-cols-2">
      {rules.map((rule) => (
        <li key={rule.label} className="flex items-center gap-2 text-[0.8rem] leading-tight">
          <span
            aria-hidden="true"
            className={[
              "h-[3px] w-[3px] rounded-full transition-colors duration-500",
              rule.met ? "bg-olive" : "bg-charcoal/25",
            ].join(" ")}
          />
          <span className={rule.met ? "text-charcoal/75" : "text-charcoal/65"}>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}
