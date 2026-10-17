import { describe, expect, it } from "vitest";
import { discordUserSearchResponseSchema } from "../../../src/schemas";

/**
 * Discord reports `accent_color: null` for every user without an accent colour,
 * which is the common case. The OpenAPI document omitted `nullable` on this one
 * field, and because a response is validated as a whole, a single such user made
 * `getDiscordUserByName()` fail outright.
 *
 * Measured against the live API, 19 of the top 25 ranked users returned
 * `accentColor: null` — so this is not a rare edge case.
 */
describe("discordUserSearchResponseSchema nullable fields", () => {
  const base = {
    id: "123456789012345678",
    username: "takasumi",
    globalName: "Takasumi",
    avatar: "abcdef",
    banner: null,
    accentColor: 16711680,
    bot: false,
    flags: 0,
  };

  it("accepts a numeric accentColor", () => {
    expect(discordUserSearchResponseSchema.parse(base).accentColor).toBe(16711680);
  });

  it("accepts accentColor: null, as Discord returns it for most users", () => {
    const parsed = discordUserSearchResponseSchema.parse({ ...base, accentColor: null });
    expect(parsed.accentColor).toBeNull();
  });

  it("still accepts the other documented nullable fields", () => {
    const parsed = discordUserSearchResponseSchema.parse({
      ...base,
      avatar: null,
      banner: null,
      globalName: null,
      accentColor: null,
    });
    expect(parsed.avatar).toBeNull();
    expect(parsed.banner).toBeNull();
    expect(parsed.globalName).toBeNull();
    expect(parsed.accentColor).toBeNull();
  });

  it("still rejects malformed values", () => {
    expect(discordUserSearchResponseSchema.safeParse({ ...base, accentColor: "red" }).success).toBe(
      false,
    );
    expect(discordUserSearchResponseSchema.safeParse({ ...base, id: 42 }).success).toBe(false);
    expect(discordUserSearchResponseSchema.safeParse({ ...base, bot: "no" }).success).toBe(false);
  });
});
