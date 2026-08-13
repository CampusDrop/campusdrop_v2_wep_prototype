/**
 * Integration boundary for the future server-side partner session.
 *
 * Do not use localStorage, cookies readable by JavaScript, or URL parameters as
 * a role/tenant source. Once the backend is available, this module must resolve
 * the current subject from the HttpOnly server session and validate that its
 * role is `partner` and its store membership on every protected request.
 */
export type PartnerPortalAccess =
  | { status: "integration-required" }
  | { status: "authorized"; partnerId: string; displayName: string };

export async function getPartnerPortalAccess(): Promise<PartnerPortalAccess> {
  // There is intentionally no fallback/mock login here.
  // The backend endpoint and HttpOnly session contract have not been connected.
  return { status: "integration-required" };
}
