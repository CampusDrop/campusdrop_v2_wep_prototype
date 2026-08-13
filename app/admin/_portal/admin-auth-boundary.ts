/**
 * Server integration boundary for the Campus Drop operations portal.
 *
 * This module must be replaced by a server-side lookup of the current actor
 * from an HttpOnly session. Browser storage, request parameters, and client
 * readable cookies must never be used as an authority source.
 */
export type AdminRole = "SUPER" | "PARTNER_MANAGER" | "USER_SERVICE_MANAGER";

export type AdminPortalAccess =
  | { status: "integration-required" }
  | { status: "unauthenticated" }
  | { status: "forbidden" }
  | { status: "authorized"; actorId: string; role: AdminRole };

export async function getAdminPortalAccess(): Promise<AdminPortalAccess> {
  // Intentionally no mock actor or fallback role. Until the backend session
  // contract exists, protected content stays unavailable on the server.
  return { status: "integration-required" };
}
