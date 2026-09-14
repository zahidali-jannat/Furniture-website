import { BRAND } from "@/lib/brand";

/**
 * The account emails: verify, welcome, reset, and the two notices that go out
 * when something happened to an account that its owner ought to know about.
 *
 * Same constraints as the enquiry confirmation — tables and inline styles,
 * Georgia standing in for Instrument Serif — and the same rule about content:
 * the only visitor-supplied value that ever reaches a message body is a first
 * name, and it is escaped. Codes and links are generated here, never echoed
 * from a request.
 */

const BONE = "#f2efe9";
const CHARCOAL = "#1a1815";
const SMOKE = "#6f6a62";
const RULE = "#dcd6cb";
const MUTED = "#8f887e";
const CLAY = "#b87a4b";

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export type Mail = { subject: string; html: string; text: string };

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

/** The greeting name only — nobody wants "Dear Anna Marie Sørensen-Hall,". */
export function firstName(fullName: string) {
  return escapeHtml(fullName.trim().split(/\s+/)[0] ?? "there");
}

function shell({
  preheader,
  headline,
  italic,
  body,
  block,
  footnote,
}: {
  preheader: string;
  headline: string;
  italic?: string;
  body: string[];
  /** The code panel or the button, already marked up. */
  block?: string;
  footnote: string;
}) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<title>${escapeHtml(headline)}</title>
<!--[if mso]><style>body,table,td{font-family:Georgia,serif !important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BONE};-webkit-text-size-adjust:100%;">

<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BONE};">
<tr><td align="center" style="padding:40px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;">

    <tr><td style="padding:0 0 44px 0;">
      <span style="font-family:${SANS};font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${CHARCOAL};">${BRAND.name}</span>
    </td></tr>

    <tr><td style="padding:0 0 ${italic ? "8" : "32"}px 0;">
      <h1 style="margin:0;font-family:${SERIF};font-weight:400;font-size:40px;line-height:1.1;letter-spacing:-0.5px;color:${CHARCOAL};">${headline}</h1>
    </td></tr>
    ${
      italic
        ? `<tr><td style="padding:0 0 32px 0;">
      <h1 style="margin:0;font-family:${SERIF};font-style:italic;font-weight:400;font-size:40px;line-height:1.1;letter-spacing:-0.5px;color:${CHARCOAL};">${italic}</h1>
    </td></tr>`
        : ""
    }

    <tr><td style="padding:0 0 28px 0;border-top:1px solid ${RULE};"></td></tr>

    ${body
      .map(
        (p) => `<tr><td style="padding:0 0 22px 0;">
      <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.68;color:${SMOKE};">${p}</p>
    </td></tr>`
      )
      .join("")}

    ${block ? `<tr><td style="padding:14px 0 36px 0;">${block}</td></tr>` : ""}

    <tr><td style="padding:0 0 46px 0;">
      <p style="margin:0 0 6px 0;font-family:${SERIF};font-size:20px;color:${CHARCOAL};">${BRAND.wordmark}</p>
      <p style="margin:0;font-family:${SANS};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${MUTED};">${BRAND.city}</p>
    </td></tr>

    <tr><td style="padding:22px 0 0 0;border-top:1px solid ${RULE};">
      <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${SMOKE};">${footnote}</p>
    </td></tr>

  </table>
</td></tr>
</table>
</body>
</html>`;
}

/** The six digits, set large enough to read off a phone held at arm's length. */
function codePanel(code: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ${RULE};">
  <tr><td style="padding:22px 34px;text-align:center;">
    <span style="font-family:${SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};display:block;margin-bottom:12px;">Your code</span>
    <span style="font-family:${SANS};font-size:34px;letter-spacing:12px;color:${CHARCOAL};font-weight:500;">${code}</span>
  </td></tr>
</table>`;
}

function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="border:1px solid ${CHARCOAL};">
    <a href="${href}" style="display:inline-block;padding:15px 34px;font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${CHARCOAL};text-decoration:none;">${label}</a>
  </td></tr>
</table>`;
}

const IGNORE_LINE =
  "If you did not ask for this, ignore this message — nothing will change and nothing further will be sent.";

// ------------------------------------------------------------------ emails --

export function verifyEmail(opts: { name: string; code: string; link: string }): Mail {
  const name = firstName(opts.name);

  return {
    subject: `${opts.code} is your ${BRAND.wordmark} verification code`,
    html: shell({
      preheader: `Your code is ${opts.code}. It is good for thirty minutes.`,
      headline: "Confirm your",
      italic: "address.",
      body: [
        `${name} — one step and the account is yours. Type the code below on the page you left open, or use the link if this is the same device.`,
        "The code is good for thirty minutes.",
      ],
      block: `${codePanel(opts.code)}
        <div style="height:18px;line-height:18px;">&nbsp;</div>
        ${button(opts.link, "Confirm by link")}`,
      footnote: `${IGNORE_LINE} Nobody at ${BRAND.wordmark} will ever ask you for this code.`,
    }),
    text: [
      `${BRAND.name}`,
      "",
      `${opts.name.split(/\s+/)[0]} — confirm your address.`,
      "",
      `Your code: ${opts.code}`,
      "It is good for thirty minutes.",
      "",
      "Or open this link on the same device:",
      opts.link,
      "",
      IGNORE_LINE,
      `Nobody at ${BRAND.wordmark} will ever ask you for this code.`,
    ].join("\n"),
  };
}

export function welcome(opts: { name: string; link: string }): Mail {
  return {
    subject: `Welcome to ${BRAND.wordmark}`,
    html: shell({
      preheader: "Your account is ready. Feel free to explore our collection.",
      headline: "Your account",
      italic: "is ready.",
      body: [
        `${firstName(opts.name)} — everything is confirmed. Feel free to explore our collection; anything you save is kept in your account and waiting when you come back.`,
        "The showroom is open by appointment, Tuesday to Saturday. Ask from any piece and the enquiry arrives with it attached.",
      ],
      block: button(opts.link, "Open your account"),
      footnote: `You are receiving this because an account was created with this address at ${BRAND.wordmark}.`,
    }),
    text: [
      BRAND.name,
      "",
      "Your account is ready. Feel free to explore our collection.",
      "",
      `Anything you save is kept in your account: ${opts.link}`,
      "",
      "The showroom is open by appointment, Tuesday to Saturday.",
    ].join("\n"),
  };
}

export function passwordReset(opts: { name: string; link: string }): Mail {
  return {
    subject: `Reset your ${BRAND.wordmark} password`,
    html: shell({
      preheader: "A link to set a new password. It expires in one hour.",
      headline: "Set a new",
      italic: "password.",
      body: [
        `${firstName(opts.name)} — someone asked to reset the password on this account. The link below opens a page where you can choose a new one.`,
        "It expires in one hour and can be used once.",
      ],
      block: button(opts.link, "Choose a new password"),
      footnote: `${IGNORE_LINE} Your current password stays valid until a new one is set.`,
    }),
    text: [
      BRAND.name,
      "",
      "Set a new password.",
      "",
      opts.link,
      "",
      "The link expires in one hour and can be used once.",
      IGNORE_LINE,
    ].join("\n"),
  };
}

/**
 * Sent when somebody tries to register an address that already has an account.
 *
 * The registration form itself cannot say "that address is taken" — that turns
 * it into a way to test whether a given person banks here. So the form says the
 * same thing either way, and the truth goes to the address's owner, who is the
 * one entitled to it.
 */
export function accountAlreadyExists(opts: {
  name: string;
  signInLink: string;
  resetLink: string;
}): Mail {
  return {
    subject: `Someone tried to register with your ${BRAND.wordmark} address`,
    html: shell({
      preheader: "You already have an account. Sign in, or reset your password.",
      headline: "You already",
      italic: "have an account.",
      body: [
        `${firstName(opts.name)} — someone just tried to create an account with this address. Because one already exists, nothing was created and nothing has changed.`,
        "If that was you, sign in with your password instead. If you have forgotten it, you can set a new one.",
      ],
      block: `${button(opts.signInLink, "Sign in")}
        <div style="height:14px;line-height:14px;">&nbsp;</div>
        <p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.6;color:${SMOKE};">
          Forgotten it? <a href="${opts.resetLink}" style="color:${CLAY};">Set a new password</a>.
        </p>`,
      footnote:
        "If this was not you, no action is needed. Your account was not accessed and no details were revealed to whoever tried.",
    }),
    text: [
      BRAND.name,
      "",
      "Someone tried to register with this address, and an account already exists.",
      "Nothing was created and nothing changed.",
      "",
      `Sign in: ${opts.signInLink}`,
      `Set a new password: ${opts.resetLink}`,
    ].join("\n"),
  };
}

/** Notice after a password change — the tripwire for a takeover nobody noticed. */
export function passwordChanged(opts: { name: string; when: Date; resetLink: string }): Mail {
  const when = opts.when.toUTCString();

  return {
    subject: `Your ${BRAND.wordmark} password was changed`,
    html: shell({
      preheader: "If this was you, nothing to do.",
      headline: "Your password",
      italic: "was changed.",
      body: [
        `${firstName(opts.name)} — the password on this account was changed on ${escapeHtml(when)}. Every other device was signed out.`,
        "If this was you, there is nothing to do.",
      ],
      block: `<p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.6;color:${SMOKE};">
        If it was not, <a href="${opts.resetLink}" style="color:${CLAY};">reset the password</a> straight away and write to us.
      </p>`,
      footnote: "This notice is sent on every password change and cannot be turned off.",
    }),
    text: [
      BRAND.name,
      "",
      `Your password was changed on ${when}. Every other device was signed out.`,
      "",
      `If this was not you: ${opts.resetLink}`,
    ].join("\n"),
  };
}
