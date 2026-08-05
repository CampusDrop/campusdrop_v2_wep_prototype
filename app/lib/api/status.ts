import { ApiClientError, apiClient } from "./client";

type BackendStatusPayload = {
  service: string;
  status: string;
};

export type ApiStatus = {
  service: string;
  status: "UP";
};

/** Returns only a confirmed healthy backend status. */
export async function getApiStatus(signal?: AbortSignal): Promise<ApiStatus> {
  const data = await apiClient.request<BackendStatusPayload>("/api/v1/status", {
    method: "GET",
    signal,
  });

  if (data.status !== "UP") {
    throw new ApiClientError(
      "envelope",
      "The CampusDrop backend did not report an UP status.",
    );
  }

  return {
    service: data.service,
    status: "UP",
  };
}
