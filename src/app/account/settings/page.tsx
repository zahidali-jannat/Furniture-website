import { redirect } from "next/navigation";

/**
 * Settings used to be one page holding details, password and devices. It is
 * now Profile, Preferences and Security. This redirect stays so that a link
 * somebody bookmarked — or an old email — still lands somewhere sensible.
 */
export default function SettingsRedirect() {
  redirect("/account/profile");
}
