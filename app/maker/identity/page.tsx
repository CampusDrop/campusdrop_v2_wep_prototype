import { redirect } from "next/navigation";

/** No public maker UI is exposed from legacy URLs. */
export default function LegacyMakerIdentityPage() {
  redirect("/editor");
}
