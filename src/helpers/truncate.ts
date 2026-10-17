import { TakasumiBotToolkitValidationError } from "../errors";

/** Options of {@link truncate}. */
export interface TruncateOptions {
  /** Omission marker. Defaults to `"..."`. It counts towards `maxLength`. */
  readonly ellipsis?: string;
}

/**
 * Shortens `text` so that the result is at most `maxLength` characters long.
 *
 * The ellipsis is **included** in `maxLength`:
 * `truncate("hello world", 5)` → `"he..."`.
 *
 * Lengths are counted in UTF-16 code units, matching `String.prototype.length`.
 * A cut that would split an astral character (emoji, …) drops the trailing
 * unpaired surrogate instead of returning a malformed string, so the result can
 * be one code unit shorter than `maxLength`.
 *
 * @param text - Text to shorten.
 * @param maxLength - Maximum length of the result (`0` or a positive integer).
 * @param options - Optional custom `ellipsis`.
 * @returns `text` when it already fits, otherwise the truncated text.
 * @throws {TakasumiBotToolkitValidationError} When `text` is not a string, or
 *   `maxLength` is negative, `NaN` or not an integer.
 *
 * @example
 * ```ts
 * truncate("hello world", 5); // "he..."
 * truncate("hello", 10); // "hello"
 * truncate("hello world", 0); // ""
 * ```
 */
export function truncate(text: string, maxLength: number, options: TruncateOptions = {}): string {
  if (typeof text !== "string") {
    throw new TakasumiBotToolkitValidationError("text must be a string", {
      field: "text",
      value: text,
      code: "INVALID_ARGUMENT",
    });
  }
  if (typeof maxLength !== "number" || Number.isNaN(maxLength) || !Number.isInteger(maxLength)) {
    throw new TakasumiBotToolkitValidationError("maxLength must be an integer", {
      field: "maxLength",
      value: maxLength,
      code: "INVALID_ARGUMENT",
    });
  }
  if (maxLength < 0) {
    throw new TakasumiBotToolkitValidationError("maxLength must be 0 or greater", {
      field: "maxLength",
      value: maxLength,
      code: "INVALID_ARGUMENT",
    });
  }

  const ellipsis = options.ellipsis ?? "...";
  if (typeof ellipsis !== "string") {
    throw new TakasumiBotToolkitValidationError("options.ellipsis must be a string", {
      field: "options.ellipsis",
      value: options.ellipsis,
      code: "INVALID_ARGUMENT",
    });
  }

  if (text.length <= maxLength) {
    return text;
  }
  const limit = maxLength <= ellipsis.length ? maxLength : maxLength - ellipsis.length;
  return `${sliceCodeUnits(text, limit)}${maxLength <= ellipsis.length ? "" : ellipsis}`;
}

/**
 * Takes the first `length` UTF-16 code units of `text`, then drops a trailing
 * unpaired high surrogate.
 *
 * `String.prototype.slice` counts UTF-16 code units, so cutting an astral
 * character (emoji, most CJK extensions, …) in half yields a lone surrogate.
 * Such a string is not well formed: it UTF-8 encodes to U+FFFD and is rejected
 * by APIs that validate UTF-8, which makes it a poor thing to hand back from a
 * function whose whole job is preparing text for display.
 *
 * The budget is not refilled — the result stays within `maxLength`, it simply
 * ends one code unit early rather than on a broken character.
 *
 * @param text - Text to cut.
 * @param length - Number of UTF-16 code units to keep.
 * @returns `text.slice(0, length)` without a trailing lone high surrogate.
 *
 * @example
 * ```ts
 * sliceCodeUnits("😀😀😀", 1); // "" (not "\uD83D")
 * sliceCodeUnits("あいう", 2); // "あい"
 * ```
 */
function sliceCodeUnits(text: string, length: number): string {
  const sliced = text.slice(0, length);
  const last = sliced.charCodeAt(sliced.length - 1);
  // 0xd800..0xdbff is a high surrogate; unpaired when nothing follows it.
  return last >= 0xd800 && last <= 0xdbff ? sliced.slice(0, -1) : sliced;
}
