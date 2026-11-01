import type { HealthResponse } from "@roomcraft/shared";
import { config } from "../config";

const REQUEST_TIMEOUT_MS = 10_000;

export async function fetchHealth(signal: AbortSignal): Promise<HealthResponse> {
  const response = await fetch(`${config.apiUrl}/health`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
  });
  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}`);
  }
  const body: unknown = await response.json();
  if (!isHealthResponse(body)) {
    throw new Error("Health check returned an unexpected body");
  }
  return body;
}

function isHealthResponse(value: unknown): value is HealthResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    value.status === "ok" &&
    "version" in value &&
    typeof value.version === "string"
  );
}
