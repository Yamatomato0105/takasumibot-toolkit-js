import {
  TakasumiBotToolkitError,
  TakasumiBotToolkitHttpError,
  TakasumiBotToolkitNetworkError,
  TakasumiBotToolkitTimeoutError,
} from "../errors";

/**
 * Decides whether a failed attempt may be retried.
 *
 * Retryable: network errors, timeouts and HTTP `429 / 500 / 502 / 503 / 504`.
 * Everything else (validation, configuration, parse and non transient HTTP
 * errors) is not.
 *
 * @param error - The caught value.
 * @returns `true` when the operation should be attempted again.
 *
 * @example
 * ```ts
 * isRetryableError(new TakasumiBotToolkitNetworkError("boom", { url, method })); // true
 * ```
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof TakasumiBotToolkitNetworkError) {
    return true;
  }
  if (error instanceof TakasumiBotToolkitTimeoutError) {
    return true;
  }
  if (error instanceof TakasumiBotToolkitHttpError) {
    return error.retryable === true;
  }
  if (error instanceof TakasumiBotToolkitError) {
    return error.retryable === true;
  }
  return false;
}
