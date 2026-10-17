import {
  TakasumiBotToolkitError,
  type TakasumiBotToolkitErrorOptions,
} from "./TakasumiBotToolkitError";

/**
 * Machine readable validation error codes.
 *
 * - `INVALID_GIFT_ID` — Gift code does not match `/^[A-Za-z0-9]{10}$/`.
 * - `INVALID_STOCK_ID` — Stock id is empty or blank.
 * - `STOCK_NOT_FOUND` — Stock id does not exist in `GET /v3/stock/`.
 * - `INVALID_LIMIT` — History `limit` is negative, `NaN` or not an integer.
 * - `EMPTY_ARGUMENT` — A required string argument is empty or blank.
 */
export type TakasumiBotToolkitValidationErrorCode =
  | "INVALID_GIFT_ID"
  | "INVALID_STOCK_ID"
  | "STOCK_NOT_FOUND"
  | "INVALID_LIMIT"
  | "EMPTY_ARGUMENT"
  | "INVALID_ARGUMENT";

/**
 * Thrown when an argument (or an argument derived rule such as the stock
 * history `limit`) fails client side validation.
 *
 * Validation happens before any HTTP request is made (fail fast) and is never
 * retried.
 *
 * @example
 * ```ts
 * try {
 *   await kit.getGiftInfo("short");
 * } catch (error) {
 *   if (error instanceof TakasumiBotToolkitValidationError) {
 *     console.error(error.code); // "INVALID_GIFT_ID"
 *   }
 * }
 * ```
 */
export class TakasumiBotToolkitValidationError extends TakasumiBotToolkitError {
  /** Name of the offending argument, when identifiable. */
  readonly field: string | undefined;

  /** The rejected value. */
  readonly value: unknown;

  /** Machine readable code describing the rule that was violated. */
  readonly code: TakasumiBotToolkitValidationErrorCode | undefined;

  /**
   * Creates a validation error.
   *
   * @param message - Human readable description of the validation failure.
   * @param options - `field`, `value`, `code` and inherited `cause`.
   */
  constructor(
    message: string,
    options: TakasumiBotToolkitErrorOptions & {
      readonly field?: string;
      readonly value?: unknown;
      readonly code?: TakasumiBotToolkitValidationErrorCode;
    } = {},
  ) {
    super(message, { ...options, retryable: false });
    this.field = options.field;
    this.value = options.value;
    this.code = options.code;
  }
}
