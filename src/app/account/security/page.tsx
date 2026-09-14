import { prisma } from "@/lib/db";
import { verifiedUser } from "@/lib/auth/session";
import { DetailRow, PageHeading, Section, Verified } from "@/components/account/Panels";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";
import SessionsPanel from "@/components/account/SessionsPanel";
import DeleteAccountPanel from "@/components/account/DeleteAccountPanel";
import { longDate } from "@/lib/account/format";

export const dynamic = "force-dynamic";

/**
 * Security.
 *
 * How you get in, where you are signed in, and how to leave. The last of those
 * is at the bottom behind its own confirmation rather than hidden — an account
 * that is hard to close is a dark pattern with good manners.
 */
export default async function SecurityPage() {
  const user = await verifiedUser();
  if (!user) return null;

  const providers = await prisma.authProvider.findMany({
    where: { userId: user.id },
    select: { provider: true, createdAt: true },
  });

  const google = providers.find((p) => p.provider === "google");

  return (
    <div>
      <PageHeading
        eyebrow="Security"
        title="How you"
        italic="sign in."
        intro="Your password is stored only as a hash, one-time codes the same. Nobody here can read either, and nobody from the workshop will ever ask you for one."
      />

      <div className="space-y-16">
        <Section title="Sign-in methods">
          <dl className="max-w-xl">
            <DetailRow
              label="Email"
              value={
                <span className="flex flex-wrap items-center gap-4">
                  <span>{user.email}</span>
                  <Verified yes />
                </span>
              }
            />
            <DetailRow
              label="Phone"
              value={
                user.phone ? (
                  <span className="flex flex-wrap items-center gap-4">
                    <span>{user.phone}</span>
                    <Verified yes={Boolean(user.phoneVerifiedAt)} />
                  </span>
                ) : (
                  <span className="text-charcoal/65">Not added</span>
                )
              }
            />
            <DetailRow
              label="Password"
              value={
                user.passwordHash ? (
                  <span className="text-charcoal/80">Set</span>
                ) : (
                  <span className="text-charcoal/65">None — you sign in with Google</span>
                )
              }
            />
            <DetailRow
              label="Google"
              value={
                google ? (
                  <span className="flex flex-wrap items-center gap-4">
                    <Verified yes label="Connected" />
                    <span className="text-[0.85rem] text-charcoal/65">
                      since {longDate(google.createdAt)}
                    </span>
                  </span>
                ) : (
                  <span className="text-charcoal/65">Not connected</span>
                )
              }
            />
          </dl>
        </Section>

        <Section
          title={user.passwordHash ? "Change your password" : "Set a password"}
          description={
            user.passwordHash
              ? "Every other device is signed out when you change it, and we send a note to your address either way."
              : "Your account was opened with Google and has no password. Setting one adds a second way in — it does not replace Google."
          }
        >
          <ChangePasswordForm hasPassword={Boolean(user.passwordHash)} />
        </Section>

        <Section
          title="Devices"
          description="Every browser currently holding a signed-in session. If you see one you do not recognise, sign them all out and change your password."
        >
          <SessionsPanel />
        </Section>

        <Section title="Close your account">
          <DeleteAccountPanel hasPassword={Boolean(user.passwordHash)} />
        </Section>
      </div>
    </div>
  );
}
