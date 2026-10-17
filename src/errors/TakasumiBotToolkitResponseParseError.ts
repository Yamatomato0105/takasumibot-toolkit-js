import type { ZodIssue } from "zod";
import {
  TakasumiBotToolkitError,
  type TakasumiBotToolkitErrorOptions,
} from "./TakasumiBotToolkitError";

/**
 * Thrown when a **2xx** response cannot be parsed as JSON, or when it parses
 * but fails `zod` validation.
 *
 * Non 2xx responses never produce this error: when an error response body is
 * unparsable the SDK raises a {@link TakasumiBotToolkitHttpError} and keeps the raw
 * body instead.
 *
 * @example
 * ```ts
 * try {
 *   await kit.getTaxInfo();
 * } catch (error) {
 *   if (error instanceof TakasumiBotToolkitResponseParseError) {
 *     console.error(error.status, error.zodIssues, error.rawBody);
 *   }
 * }
 * ```
 */
export class TakasumiBotToolkitResponseParseError extends TakasumiBotToolkitError {
  /** Request URL whose response could not be parsed. */
  readonly url: string;

  /** HTTP method of the request. */
  readonly method: string;

  /** HTTP status of the response (when known). */
  readonly status: number | undefined;

  /** Raw response body text, when available. */
  readonly rawBody: string | undefined;

  /** `zod` issues, when the failure came from schema validation. */
  readonly zodIssues: readonly ZodIssue[] | undefined;

  /**
   * Creates a response-parse error.
   *
   * @param message - Human readable description.
   * @param params - Request context plus optional raw body / zod issues.
   * @param options - Inherited `cause` (a `SyntaxError` or a `ZodError`).
   */
  constructor(
    message: string,
    params: {
      readonly url: string;
      readonly method: string;
      readonly status?: number;
      readonly rawBody?: string;
      readonly zodIssues?: readonly ZodIssue[];
    },
    options: TakasumiBotToolkitErrorOptions = {},
  ) {
    super(message, { ...options, retryable: false });
    this.url = params.url;
    this.method = params.method;
    this.status = params.status;
    this.rawBody = params.rawBody;
    this.zodIssues = params.zodIssues;
  }
}
