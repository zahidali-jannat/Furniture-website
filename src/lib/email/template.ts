import { BRAND } from "@/lib/brand";

/**
 * The confirmation email.
 *
 * Written as tables with inline styles because email clients are not browsers:
 * no flexbox, no grid, no external stylesheets, no webfonts worth relying on.
 * Georgia stands in for the site's Instrument Serif — it is the closest thing
 * present on essentially every client.
 *
 * Nothing the sender typed is interpolated into the body. The address is the
 * only input, and it is used as a recipient, never as content.
 */

const BONE = "#f2efe9";
const CHARCOAL = "#1a1815";
const SMOKE = "#6f6a62";
const RULE = "#dcd6cb";
// Muted, but still legible on the bone ground; the lighter grey washed out.
const MUTED = "#8f887e";

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export const CONFIRMATION_SUBJECT = `${BRAND.wordmark} — your visit`;

/** Hidden line the inbox shows next to the subject. */
const PREHEADER =
  "The showroom is open by appointment, Tuesday to Saturday. We will be in touch within two working days.";

export function confirmationText() {
  return [
    BRAND.name,
    "",
    "Thank you for writing.",
    "",
    "We have your address and someone from the workshop will reply within two",
    "working days to arrange a time.",
    "",
    "The showroom is open by appointment, Tuesday to Saturday, 10 until 6.",
    "Bring the dimensions of the room if you have them — a rough sketch on paper",
    "is genuinely more useful to us than a floor plan.",
    "",
    "WHAT HAPPENS NEXT",
    "01  We reply to arrange a time.",
    "02  You sit in the pieces. There is no appointment fee and nothing to sign.",
    "03  If something fits, we quote in writing. Lead time is sixteen weeks.",
    "",
    `${BRAND.city}`,
    BRAND.established,
    "",
    "You are receiving this because this address was entered on our site.",
    "If that was not you, ignore this message and nothing further will be sent.",
  ].join("\n");
}

export function confirmationHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${CONFIRMATION_SUBJECT}</title>
<!--[if mso]><style>body,table,td{font-family:Georgia,serif !important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BONE};-webkit-text-size-adjust:100%;">

<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
  ${PREHEADER}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BONE};">
<tr><td align="center" style="padding:40px 16px;">

  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:${BONE};">

    <!-- wordmark -->
    <tr><td style="padding:0 0 44px 0;">
      <span style="font-family:${SANS};font-size:11px;letter-spacing:4px;text-transform:uppercase;color:${CHARCOAL};">
        ${BRAND.name}
      </span>
    </td></tr>

    <!-- headline -->
    <tr><td style="padding:0 0 8px 0;">
      <h1 style="margin:0;font-family:${SERIF};font-weight:400;font-size:42px;line-height:1.08;letter-spacing:-0.5px;color:${CHARCOAL};">
        Thank you for
      </h1>
    </td></tr>
    <tr><td style="padding:0 0 32px 0;">
      <h1 style="margin:0;font-family:${SERIF};font-style:italic;font-weight:400;font-size:42px;line-height:1.08;letter-spacing:-0.5px;color:${CHARCOAL};">
        writing.
      </h1>
    </td></tr>

    <tr><td style="padding:0 0 28px 0;border-top:1px solid ${RULE};"></td></tr>

    <tr><td style="padding:0 0 22px 0;">
      <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.68;color:${SMOKE};">
        We have your address, and someone from the workshop will reply within two
        working days to arrange a time.
      </p>
    </td></tr>

    <tr><td style="padding:0 0 40px 0;">
      <p style="margin:0;font-family:${SANS};font-size:15px;line-height:1.68;color:${SMOKE};">
        The showroom is open by appointment, Tuesday to Saturday, 10 until 6.
        Bring the dimensions of the room if you have them — a rough sketch on
        paper is genuinely more useful to us than a floor plan.
      </p>
    </td></tr>

    <!-- steps -->
    <tr><td style="padding:0 0 14px 0;">
      <span style="font-family:${SANS};font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${MUTED};">
        What happens next
      </span>
    </td></tr>

    <tr><td style="padding:0 0 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${[
          ["01", "We reply to arrange a time that suits you."],
          ["02", "You sit in the pieces. No appointment fee, nothing to sign."],
          ["03", "If something fits, we quote in writing. Lead time is sixteen weeks."],
        ]
          .map(
            ([n, copy]) => `
        <tr>
          <td width="44" valign="top" style="padding:14px 0;border-top:1px solid ${RULE};font-family:${SANS};font-size:11px;letter-spacing:2px;color:${MUTED};">${n}</td>
          <td valign="top" style="padding:14px 0;border-top:1px solid ${RULE};font-family:${SANS};font-size:14px;line-height:1.6;color:${CHARCOAL};">${copy}</td>
        </tr>`
          )
          .join("")}
      </table>
    </td></tr>

    <!-- signature block -->
    <tr><td style="padding:0 0 46px 0;">
      <p style="margin:0 0 6px 0;font-family:${SERIF};font-size:20px;color:${CHARCOAL};">
        ${BRAND.wordmark}
      </p>
      <p style="margin:0;font-family:${SANS};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:${MUTED};">
        ${BRAND.city}
      </p>
    </td></tr>

    <!-- footer -->
    <tr><td style="padding:22px 0 0 0;border-top:1px solid ${RULE};">
      <p style="margin:0 0 8px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${SMOKE};">
        ${BRAND.established} · ${BRAND.tagline}
      </p>
      <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${SMOKE};">
        You are receiving this because this address was entered on our site.
        If that was not you, ignore this message — nothing further will be sent.
      </p>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
}
