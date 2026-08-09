const API_BASE_URL_ENV_KEY = "VITE_CAMPUSDROP_API_BASE_URL";

export class ApiConfigurationError extends Error {
  readonly name = "ApiConfigurationError";

  constructor(message: string) {
    super(message);
  }
}

/**
 * Reads the public Vite API origin only when a request is about to be made.
 * This keeps static builds usable before a developer has created `.env.local`.
 */
export function getApiBaseUrl(): string {
  const configuredValue = import.meta.env.VITE_CAMPUSDROP_API_BASE_URL?.trim();

  if (!configuredValue) {
    throw new ApiConfigurationError(
      `${API_BASE_URL_ENV_KEY} is required. Set it to the backend origin in .env.local.`,
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredValue);
  } catch {
    throw new ApiConfigurationError(
      `${API_BASE_URL_ENV_KEY} must be a valid http or https origin.`,
    );
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new ApiConfigurationError(
      `${API_BASE_URL_ENV_KEY} must use the http or https protocol.`,
    );
  }

  if (
    parsedUrl.username ||
    parsedUrl.password ||
    parsedUrl.pathname !== "/" ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new ApiConfigurationError(
      `${API_BASE_URL_ENV_KEY} must be an origin without credentials, a path, query, or hash.`,
    );
  }

  return parsedUrl.origin;
}
