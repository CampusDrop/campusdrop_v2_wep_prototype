import assert from "node:assert/strict";
import test from "node:test";

import { ApiClientError, buildApiRequestUrl } from "../app/lib/api/client.ts";

const apiBaseUrl = "http://api.campusdrop.test:8080";

test("keeps normal API paths and queries on the configured origin", () => {
  const url = buildApiRequestUrl("/api/v1/themes?locale=ko", apiBaseUrl);

  assert.equal(url.href, "http://api.campusdrop.test:8080/api/v1/themes?locale=ko");
  assert.equal(url.origin, apiBaseUrl);
});

test("rejects network-path references that could replace the API origin", () => {
  assert.throws(
    () => buildApiRequestUrl("//untrusted.example/api/v1/status", apiBaseUrl),
    (error: unknown) =>
      error instanceof ApiClientError && error.kind === "configuration",
  );
});

test("rejects paths that normalize to another origin", () => {
  assert.throws(
    () => buildApiRequestUrl("/\\\\untrusted.example/api/v1/status", apiBaseUrl),
    (error: unknown) =>
      error instanceof ApiClientError && error.kind === "configuration",
  );
});
