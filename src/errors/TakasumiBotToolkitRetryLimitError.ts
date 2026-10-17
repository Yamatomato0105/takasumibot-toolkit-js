import { TakasumiBotToolkitError } from "./TakasumiBotToolkitError";
import type { TakasumiBotToolkitErrorOptions } from "./TakasumiBotToolkitError";

/**
 * Thrown when a retryable failure keeps happening and `retry.maxRetries` is
 * exhausted.
 *
 * The last error is available both as `cause` (standard) and as the typed
 * `lastError` field. A `TakasumiBotToolkitRetryLimitError` is not retried again.
 *
 * @example
 * ```ts
 * try {
 *   await kit.getTaxInfo();
 * } catch (error) {
 *   if (error instanceof TakasumiBotToolkitRetryLimitError) {
 *     console.error(error.attempts, error.maxRetries, error.lastError.name);
 *   }
 * }
 * ```
 */
export class TakasumiBotToolkitRetryLimitError extends TakasumiBotToolkitError {
  /** Total number of attempts performed (initial attempt + retries). */
  readonly attempts: number;

  /** Configured maximum number of retries. */
  readonly maxRetries: number;

  /** The last error observed, typed as an SDK error. */
  readonly lastError: TakasumiBotToolkitError;

  /** Request URL that failed. */
  readonly url: string;

  /** HTTP method of the request. */
  readonly method: string;

  /**
   * Creates a retry-limit error.
   *
   * @param params - Last error, attempt counters and request context.
   * @param options - Additional overrides (rarely needed).
   */
  constructor(
    params: {
      readonly lastError: TakasumiBotToolkitError;
      readonly attempts: number;
      readonly maxRetries: number;
      readonly url: string;
      readonly method: string;
    },
    options: TakasumiBotToolkitErrorOptions = {},
  ) {
    super(
      `Retry limit exceeded after ${params.attempts} attempts (maxRetries=${params.maxRetries}) for ${params.method} ${params.url}`,
      { ...options, cause: options.cause ?? params.lastError, retryable: false },
    );
    this.attempts = params.attempts;
    this.maxRetries = params.maxRetries;
    this.lastError = params.lastError;
    this.url = params.url;
    this.method = params.method;
  }
}
