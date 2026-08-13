import { redirect } from "next/navigation";

/** Legacy public URL: the maker is loaded only from the server-authorized admin editor. */
export default function LegacyMakerPage() {
  redirect("/editor");
}
