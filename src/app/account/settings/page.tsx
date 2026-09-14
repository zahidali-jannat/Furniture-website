import { prisma } from "@/lib/db";
import { verifiedUser } from "@/lib/auth/session";
import { DetailRow, Section, Verified } from "@/components/account/Panels";
import ProfileForm from "@/components/account/ProfileForm";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";
import SessionsPanel from "@/components/account/SessionsPanel";
import DeleteAccountPanel from "@/components/account/DeleteAccountPanel";

export const dynamic = "force-dynamic";

/**
 * Settings.
 *
 * Four sections in the order they are needed: who you are, how you sign in,
 * where you are signed in, and how to leave. The last one is at the bottom
 * behind its own confirmation, not tucked away somewhere it cannot be found —
 * an account that is hard to close is a dark pattern with good manners.
 */
export default async function SettingsPage() {
  const user = await verifiedUser();
  if (!user) return null;

  const providers = await prisma.authProvider.findMany({
    where: { userId: user.id },
    select: { provider: true, createdAt: true },
  });

  const google = providers.find((p) => p.provider === "google");

  return (
    <div className="space-y-16">
      <header>
        <p className="eyebrow text-[0.6rem] text-charcoal/40">Settings</p>
        <h1 className="display mt-6 text-[clamp(2.2rem,5vw,3.4rem)] leading-[0.98] text-charcoal">
          What we hold
          <br />
          <em className="font-normal italic">about you.</em>
        </h1>
      </header>

      <Section
        title="Your details"
        description="Your name and the number we reach you on. Everything here is used to answer you and for nothing else."
      >
        <ProfileForm fullName={user.fullName} email={user.email} phone={user.phone} />
      </Section>

      <Section title="How you sign in">
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
                <span className="text-charcoal/40">Not added</span>
              )
            }
          />
          <DetailRow
            label="Password"
            value={
              user.passwordHash ? (
                <span className="text-charcoal/60">Set</span>
              ) : (
                <span className="text-charcoal/40">None — you sign in with Google</span>
              )
            }
          />
          <DetailRow
            label="Google"
            value={
              google ? (
                <span className="flex flex-wrap items-center gap-4">
                  <Verified yes label="Connected" />
                  <span className="text-[0.75rem] text-charcoal/35">
                    since{" "}
                    {google.createdAt.toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </span>
                </span>
              ) : (
                <span className="text-charcoal/40">Not connected</span>
              )
            }
          />
        </dl>

        <div className="mt-10">
          <ChangePasswordForm hasPassword={Boolean(user.passwordHash)} />
        </div>
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
  );
}
