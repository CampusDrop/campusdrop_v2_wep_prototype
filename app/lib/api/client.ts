import { ApiConfigurationError, getApiBaseUrl } from "./config";

export type ApiErrorKind =
  | "configuration"
  | "aborted"
  | "network"
  | "unauthorized"
  | "forbidden"
  | "conflict"
  | "validation"
  | "http"
  | "envelope"
  | "invalid-response";

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: ApiErrorPayload | null;
  timestamp: string;
  traceId: string;
};

export class ApiClientError extends Error {
  readonly name = "ApiClientError";

  constructor(
    readonly kind: ApiErrorKind,
    message: string,
    readonly options: {
      status?: number;
      code?: string;
      details?: unknown;
      traceId?: string;
    } = {},
  ) {
    super(message);
  }
}

type AccessTokenProvider = () => string | undefined;

export type ApiRequestOptions = Omit<RequestInit, "body" | "headers"> & {
  body?: BodyInit | null;
  headers?: HeadersInit;
  accessToken?: string;
};

export type ApiClientOptions = {
  getAccessToken?: AccessTokenProvider;
};

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.success === "boolean" &&
    "data" in candidate &&
    "error" in candidate &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.traceId === "string"
  );
}

function errorKindForStatus(status: number): ApiErrorKind {
  switch (status) {
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 409:
      return "conflict";
    case 422:
      return "validation";
    default:
      return "http";
  }
}

function getEnvelopeErrorMessage(envelope: ApiEnvelope<unknown>, fallback: string): string {
  return envelope.error?.message?.trim() || fallback;
}

async function parseEnvelope(response: Response): Promise<ApiEnvelope<unknown> | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    const body: unknown = await response.json();
    return isApiEnvelope(body) ? body : undefined;
  } catch {
    return undefined;
  }
}

function buildRequestUrl(path: string): URL {
  if (!path.startsWith("/")) {
    throw new ApiClientError(
      "configuration",
      "API request paths must start with '/'.",
    );
  }

  return new URL(path, getApiBaseUrl());
}

export function createApiClient(options: ApiClientOptions = {}) {
  async function request<T>(
    path: string,
    requestOptions: ApiRequestOptions = {},
  ): Promise<T> {
    let requestUrl: URL;
    try {
      requestUrl = buildRequestUrl(path);
    } catch (error) {
      if (error instanceof ApiConfigurationError) {
        throw new ApiClientError("configuration", error.message);
      }
      throw error;
    }

    const headers = new Headers(requestOptions.headers);
    headers.set("Accept", "application/json");

    const accessToken = requestOptions.accessToken?.trim() || options.getAccessToken?.()?.trim();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    let response: Response;
    try {
      response = await fetch(requestUrl, {
        ...requestOptions,
        headers,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiClientError("aborted", "The API request was cancelled.");
      }

      throw new ApiClientError(
        "network",
        "Unable to reach the CampusDrop backend. Check the network and API base URL.",
      );
    }

    const envelope = await parseEnvelope(response);
    if (!response.ok) {
      throw new ApiClientError(
        errorKindForStatus(response.status),
        envelope
          ? getEnvelopeErrorMessage(envelope, `The API request failed (${response.status}).`)
          : `The API request failed (${response.status}).`,
        {
          status: response.status,
          code: envelope?.error?.code,
          details: envelope?.error?.details,
          traceId: envelope?.traceId,
        },
      );
    }

    if (!envelope) {
      throw new ApiClientError(
        "invalid-response",
        "The API response did not use the CampusDrop response envelope.",
        { status: response.status },
      );
    }

    if (!envelope.success) {
      throw new ApiClientError(
        "envelope",
        getEnvelopeErrorMessage(envelope, "The API reported an unsuccessful request."),
        {
          status: response.status,
          code: envelope.error?.code,
          details: envelope.error?.details,
          traceId: envelope.traceId,
        },
      );
    }

    return envelope.data as T;
  }

  return { request };
}

export const apiClient = createApiClient();
