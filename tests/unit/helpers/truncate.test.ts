import { describe, expect, it } from "vitest";
import { TakasumiBotToolkitValidationError } from "../../../src/errors";
import { truncate } from "../../../src/helpers/truncate";

describe("truncate", () => {
  it("includes the ellipsis in maxLength", () => {
    expect(truncate("hello world", 5)).toBe("he...");
    expect(truncate("hello world", 5)).toHaveLength(5);
  });

  it("returns short texts untouched", () => {
    expect(truncate("hello", 10)).toBe("hello");
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("returns an empty string for maxLength 0", () => {
    expect(truncate("hello world", 0)).toBe("");
  });

  it("omits the ellipsis when maxLength is not larger than it", () => {
    expect(truncate("hello world", 2)).toBe("he");
    expect(truncate("hello world", 3)).toBe("hel");
    expect(truncate("hello world", 4)).toBe("h...");
  });

  it("supports a custom ellipsis", () => {
    expect(truncate("hello world", 6, { ellipsis: "…" })).toBe("hello…");
  });

  it("never returns an unpaired surrogate when cutting an astral character", () => {
    // Slicing on UTF-16 code units can split a surrogate pair; a lone surrogate
    // UTF-8 encodes to U+FFFD, so it must not be handed back.
    const hasLoneSurrogate = (value: string): boolean =>
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(value);

    for (const text of [
      "\u{1F600}\u{1F600}\u{1F600}",
      "\u{1F1EF}\u{1F1F5}",
      "\u{1F468}\u200D\u{1F469}",
    ]) {
      for (let maxLength = 0; maxLength <= text.length; maxLength++) {
        const result = truncate(text, maxLength);
        expect(result.length).toBeLessThanOrEqual(maxLength);
        expect(hasLoneSurrogate(result)).toBe(false);
      }
    }
  });

  it("keeps astral characters intact when they fit within maxLength", () => {
    // One emoji is 2 UTF-16 code units, so maxLength 2 holds exactly one.
    expect(truncate("\u{1F600}\u{1F600}", 2)).toBe("\u{1F600}");
    expect(truncate("\u{1F600}\u{1F600}", 4)).toBe("\u{1F600}\u{1F600}");
    // maxLength <= ellipsis.length drops the ellipsis entirely.
    expect(truncate("あいう", 2)).toBe("あい");
  });

  it("rejects invalid arguments", () => {
    expect(() => truncate(42 as unknown as string, 5)).toThrowError(
      TakasumiBotToolkitValidationError,
    );
    expect(() => truncate("hello", -1)).toThrowError(TakasumiBotToolkitValidationError);
    expect(() => truncate("hello", Number.NaN)).toThrowError(TakasumiBotToolkitValidationError);
    expect(() => truncate("hello", 1.5)).toThrowError(TakasumiBotToolkitValidationError);
    expect(() => truncate("hello", 5, { ellipsis: 3 as unknown as string })).toThrowError(
      TakasumiBotToolkitValidationError,
    );
  });
});
