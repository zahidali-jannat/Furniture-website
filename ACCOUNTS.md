# Accounts

Members can open an account, save pieces, and see the enquiries they have sent.
This file is the whole of how that works: what a visitor goes through, what you
have to set up before it runs, and the decisions behind it.

The catalogue is unaffected. Products still come from the folders under
`image/` exactly as [COLLECTIONS.md](COLLECTIONS.md) describes, and every
collection and product page is still built ahead of time and served without
touching the database.

---

## 1. What a visitor sees

```
/login                        sign in, or continue with Google
/create-account               name, email, phone, password
/create-account/verify        the codes
/forgot-password              ask for a reset link
/reset-password?token=…       choose a new password

/account                      overview — figures, quick actions, recent activity
/account/profile              name, number, what is confirmed, what we hold
/account/saved                saved pieces, and asking about one
/account/enquiries            every enquiry, by reference
/account/enquiries/MN-…       one enquiry in full, with our reply
/account/consultations        appointments: upcoming, past, and asking for a time
/account/preferences          what we may write about
/account/security             password, Google, devices, closing the account
/account/help                 how to reach a person, and the questions we are asked
```

The navigation is a column in the margin on desktop and a scrollable row of
words on a phone. It lists only what the site can fill: there is no Orders and
no Addresses section, because there is no checkout and nothing to deliver to.
The tables for both are ready when the shop is — see "Not here yet" at the end.

`/account/settings` redirects to `/account/profile`, so older links still land
somewhere sensible.

**Opening an account.** Everything is asked for on one screen. We then send a
six-digit code to the address and another to the phone. Both have to come back
before the account opens — the email can also be confirmed by clicking the link
in the message, including on a different device, and the screen they left open
notices within a few seconds and moves on by itself.

**With no SMS gateway configured**, the phone half is skipped rather than
demanded: no text can arrive, so asking for the code would strand every visitor
on the verification screen. The account opens on the proven email address, the
number is kept on file unconfirmed, and the dashboard asks for it once a gateway
exists. The account is still only marked ACTIVE with both proofs in — what
changes is whether somebody is let in, not what we claim to have checked. Set
Twilio credentials and both codes are required again, with no code change.

**Signing in with Google** is offered only when Google credentials are
configured; otherwise the button is not shown at all rather than failing when
pressed. Someone who already has an account with the same address gets Google
added to it rather than a second account.

**Saving a piece** is a link on any product page. Pressed while signed out, it
remembers where you were, asks you to sign in, and brings you back. From the
saved list, "Ask about it" opens a two-line form and files an enquiry against
that piece — the name, address and number come from the session, so all that is
asked for is the question.

**Consultations are requested, not booked.** A member proposes a kind, a day
and a time; the studio confirms it by hand and the row says "awaiting
confirmation" until it does. Moving a confirmed appointment puts it back to
awaiting confirmation, because the studio has not agreed to the new time yet. A
self-service calendar handing out confirmations nobody had agreed to would be
the one dishonest thing in the whole account area.

**Times are showroom times.** A `datetime-local` input sends a naive
"2026-10-03T15:00" with no zone, and three clocks could claim it: the
visitor's, the server's and the showroom's. Only the last one matters —
somebody has to walk through a door in Copenhagen — so the string is read as
Copenhagen time, stored as the instant that represents, and printed back in
Copenhagen time. What you type is what the clock on the showroom wall will say.
`src/lib/account/zone.ts` is where that happens, and the opening-hours check
reads the same clock.

**Recently viewed** is kept in the browser's own storage and never sent
anywhere. Browsing history is the most personal thing a furniture site could
collect and the least necessary: the only job it does here is helping somebody
find their way back to a chair, and a device can remember that by itself.

---

## 2. What you have to set up

Three things, in this order. The first is required; the other two can wait.

### A database — required

Accounts need Postgres. There is one described in `docker-compose.yml` for
working locally:

```bash
docker compose up -d db     # or: npm run db:up
npm run db:migrate          # create the tables
npm run catalogue:sync      # mirror the catalogue into them
```

Any hosted Postgres works just as well — Neon, Supabase, Railway, RDS. Put its
connection string in `DATABASE_URL` in `.env.local`, and on a managed provider
remember `?sslmode=require`.

Then generate `AUTH_SECRET`, which signs the session cookies:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Use a different one in production, and treat changing it as signing every
member out — because that is what it does.

### Email — required before anyone can actually register

The same SMTP settings the enquiry form already uses. With none configured,
verification emails are written to `.mail/` instead of sent, and the
verification screen says so plainly rather than telling someone to check an
inbox that will stay empty.

### A text-message gateway — optional

Twilio, from `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_FROM` in
`.env.local`. Called over its ordinary web API, so there is no extra library to
install.

With none configured, registration finishes on the email code alone (above), and
any code that could not be sent is written to `.sms/`, printed in the terminal,
and — outside production only — shown on the verification screen itself when you
press "Send another code". Nothing has to be dug out of a folder to test the
flow, and nothing leaks in production: the code is stripped from the response
there.

### Google sign-in — optional

From <https://console.cloud.google.com/apis/credentials>: create an OAuth client
ID of type "Web application", and register this exact redirect URI, port
included:

```
http://localhost:3000/api/auth/google/callback
```

…and the same path on your live domain. The only scopes needed are `openid`,
`userinfo.email` and `userinfo.profile`. Put the client ID and secret in
`.env.local`. The secret is read on the server only and never reaches a browser.

Every one of these is documented with its own note in
[.env.example](.env.example).

---

## 3. How it is built

Next.js route handlers are the API. This is a Next.js project, so a second
Express server on another port would mean two things to start, two deployments,
and two places for a session cookie to go wrong, in exchange for nothing.

The separation is by file rather than by framework:

```
prisma/schema.prisma         every table
prisma.config.ts             where the CLI finds the database
src/lib/db.ts                the Prisma client (one per process)
src/lib/auth/
  config.ts                  every tunable number and secret, in one place
  validation.ts              the shape of every request body (Zod)
  password.ts                hashing, and the rules for choosing one
  tokens.ts                  random tokens, six-digit codes, their digests
  jwt.ts                     the three signed tokens and what keeps them apart
  cookies.ts                 every cookie, all httpOnly bar one
  session.ts                 signing in, refreshing, revoking
  pending.ts                 a registration in progress
  verification.ts            email and phone codes
  google.ts                  the OAuth round trip
  http.ts                    response shapes, rate limiting
src/lib/account/
  enquiries.ts               statuses, listing, one enquiry, creating one
  consultations.ts           kinds, opening hours, requesting and listing
  preferences.ts             the switches and their defaults
  reference.ts               MN-2609-4KTQ, and retrying a collision
  zone.ts                    showroom time, in and out
  format.ts                  how a date is written
  validation.ts              the shape of every portal request (Zod)
src/app/api/auth/*           register, verify, login, refresh, password, google
src/app/api/account/*        profile, favourites, enquiries, consultations,
                             preferences, sessions, delete
src/middleware.ts            the gate in front of /account
src/components/account/*     the portal: sidebar, forms, panels, header menu
```

### The endpoints

```
GET    /api/auth/me                          who is signed in
PATCH  /api/account/profile                  name and number
GET    /api/account/favourites               saved pieces
POST   /api/account/favourites               save one
DELETE /api/account/favourites?slug=…        remove one
GET    /api/account/enquiries                every enquiry
POST   /api/account/enquiries                start one
GET    /api/account/enquiries/MN-…           one, in full
GET    /api/account/consultations            upcoming and past
POST   /api/account/consultations            ask for a time
PATCH  /api/account/consultations/MN-…       move it
DELETE /api/account/consultations/MN-…       cancel it
GET    /api/account/preferences              the switches
PATCH  /api/account/preferences              change one (partial bodies only)
GET    /api/account/sessions                 signed-in devices
DELETE /api/account/sessions                 sign out everywhere else
POST   /api/account/delete                   close the account
```

Every one of them starts from the session and scopes its query by that user id.
No route takes a user id from a request, and a reference somebody guessed is
still not theirs to read: the reference and the owner are matched in the same
query.

The pages themselves do not call these. They are server components that read
the database directly in one pass, so a member's data never travels as JSON a
cache could keep and nothing arrives after a spinner. The endpoints exist for
the things a page cannot do — changing something, and the two panels that
genuinely need to fetch (devices, and the header menu).

### Legibility

The portal's text tones are chosen by measurement, not by eye. Charcoal at 40%
over the bone ground measures 2.5:1 — it looks tasteful in a mockup and
disappears on a real screen in daylight. Every piece of text in the account area
is at 65% or above, which is where the ratio crosses 4.5:1, and nothing is set
below 0.68rem. Clay and olive stay as accents (a dot, a rule, a hover) and two
darker relatives, `rust` and `moss`, carry error and confirmation text at 5.9:1
and 6.6:1.

There is a check for this: it loads every account page in a real browser, walks
each text node, and compares the rendered colour against the background actually
behind it. It currently reports every element passing AA.

### The tables

Accounts: `User`, `AuthProvider`, `EmailVerificationToken`, `PhoneOtp`,
`PasswordResetToken`, `Session`, `UserPreference`.

The portal: `Enquiry` (with a quotable `reference`, a status the workshop moves
along, and one written `response`) and `Consultation` (a requested time, a
confirmed one kept separately, and a reference of its own).

Catalogue: `Collection`, `Category`, `Product`, `ProductImage`,
`ProductVariant`, `SavedProduct`, `Enquiry`.

The catalogue tables are a **mirror**, not the source. The folders under
`image/` remain authoritative and the public pages still read the generated
JSON, so browsing costs no queries and survives the database being down. What
the mirror buys is that a saved piece and an enquiry point at real rows with
real foreign keys. `npm run catalogue:sync` refreshes it; a piece favourited
before a sync has been run is mirrored on the spot rather than failing.

`ProductVariant` is the one table nothing writes yet. Finishes and materials
are not in the folder catalogue, and the table is there so that adding one
later is a row rather than a migration against live data.

---

## 4. The security decisions, and why

**Nothing that can authenticate is stored in a form that can be used.**
Passwords are bcrypt at cost 12. Six-digit codes are bcrypt too — a million
possibilities is nothing to a GPU. Refresh tokens, verification links and reset
links are 32 random bytes stored as a SHA-256 digest; there is nothing to guess,
so a fast digest is the right tool. A dump of this database lets nobody sign in
as anybody.

**The forms will not say who holds an account here.** Registering an address
that already exists produces the same response, in the same shape, as a fresh
one — and an email goes to that address's owner saying somebody tried, because
they are the only person entitled to know. Signing in with a wrong password, an
unknown address, or an account that only ever used Google all return one
sentence and take about the same time; the fake comparison on the miss path is
there so the difference cannot be measured. "Send me a reset link" always
answers the same way.

**Codes expire and are spent.** Ten minutes for a text, thirty for an email.
Five wrong guesses and the code is dead even if the sixth is right, because rate
limiting alone cannot stop this — it is per IP, and the attacker picks the IP.
Asking for a new code cancels the old one.

**Sessions rotate and theft is detectable.** A fifteen-minute access token
(a signed JWT) and a thirty-day refresh token (opaque, checked against the
database every time). Each use of a refresh token issues a new one and marks the
old row spent. If a spent token is ever presented again, one of two people is
holding a copy and there is no way to tell which, so every session on the
account is revoked and both have to sign in again. That is the intended outcome.

**Cookies are httpOnly**, so a cross-site scripting bug on the marketing pages
stops short of being an account takeover. The single exception is `mn_member`,
which holds `1` and nothing else so that a cached product page can tell whether
asking the server about saved pieces is worth a request. Forging it gains
nothing.

**Rate limits** sit on registration, login, verification, resends, password
reset and account deletion — most of them keyed by account as well as by IP,
because the account is the thing being attacked and the IP is the attacker's to
choose. Eight wrong passwords holds the account itself shut for fifteen minutes.

**Changing a password signs every other device out**, and sends a notice saying
so. Resetting one does the same and does not sign you in — being asked for the
new password is the one thing that proves the reset landed where you meant it.

**Google is done properly**: Authorization Code flow with PKCE, `state` bound to
the browser, `nonce` bound to the attempt, and the returned `id_token` verified
against Google's published keys rather than trusted because it arrived over
HTTPS. An unverified `email` claim is refused. The visitor's Google password is
typed on accounts.google.com and nowhere else.

**Consent is given, not assumed.** Every promotional preference starts off, and
there is no row in `UserPreference` at all until somebody expresses one. The two
that default to on — enquiry replies and consultation reminders — answer
something the person started, which is not marketing. Each switch saves on its
own and sends only the field that changed, so a page left open in another tab
cannot quietly re-consent to four other things with values it loaded an hour ago.

**What the server tells you when something breaks**: one sentence the visitor
can act on. The cause goes to the log. In development — and only there —
unsendable codes and SMTP explanations are returned as well, so the flow can be
walked through without credentials.

---

## 5. Commands

| Command | What it does |
| --- | --- |
| `npm run db:up` | Start the local Postgres in Docker |
| `npm run db:down` | Stop it (the data is kept) |
| `npm run db:migrate` | Create or update the tables |
| `npm run db:deploy` | Apply existing migrations, for a server |
| `npm run db:studio` | Browse the data in a local UI |
| `npm run catalogue:sync` | Mirror the folder catalogue into the database |

---

## 6. Not here yet, and why

- **Orders and addresses.** There is no checkout, so there is nothing to order
  and nowhere to deliver it. Both sections are absent from the navigation
  rather than present and empty — a section that has never held anything
  teaches people not to look at the others. `ProductVariant` can hold a price
  when there is one to hold, and an `Address` table is a migration away.
- **A notification centre.** Nothing generates notifications. The status on an
  enquiry and on a consultation carries the same information in the place the
  person is already looking, and an empty bell is furniture.
- **A message thread on an enquiry.** The workshop answers by email. One
  written reply on the record is honest; a chat window nobody is watching is
  not. `Enquiry.response` is where that reply lives.
- **A studio-side admin area.** Statuses are moved by hand in the database for
  now. `UserStatus`, `EnquiryStatus` and `ConsultationStatus` are the hooks for
  when there is a screen for it.
- **Changing the address on an account.** Doing it properly means proving the
  new address before the old one stops working. That is a flow, not a form
  field, so Profile says to write to the workshop instead of pretending.
- **Two-factor authentication beyond the phone code at registration.** The
  pieces are in place — `PhoneOtp`, the code input, the rate limits — but
  turning it into a sign-in step is a decision about how much friction the
  brand wants, not a technical gap.
