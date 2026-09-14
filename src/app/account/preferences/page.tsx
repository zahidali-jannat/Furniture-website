import { verifiedUser } from "@/lib/auth/session";
import { DESCRIPTIONS, getPreferences } from "@/lib/account/preferences";
import { smsConfigured } from "@/lib/sms/sender";
import { PageHeading } from "@/components/account/Panels";
import PreferencesForm from "@/components/account/PreferencesForm";

export const dynamic = "force-dynamic";

/** What we may write to somebody about, and how. */
export default async function PreferencesPage() {
  const user = await verifiedUser();
  if (!user) return null;

  const preferences = await getPreferences(user.id);

  return (
    <div>
      <PageHeading
        eyebrow="Preferences"
        title="What we"
        italic="send you."
        intro="We write rarely and never sell an address. Everything that is not a reply to something you started starts switched off."
      />

      <PreferencesForm
        initial={preferences}
        descriptions={DESCRIPTIONS}
        canText={smsConfigured()}
      />
    </div>
  );
}
