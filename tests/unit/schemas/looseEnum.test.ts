import { describe, expect, it } from "vitest";
import {
  GIFT_STATUSES,
  GIFT_TYPES,
  STOCK_IDS,
  giftResponseSchema,
  isKnownValue,
  looseEnum,
  stockListResponseSchema,
} from "../../../src/schemas";

/**
 * A response is validated as a whole, so a single value the API adds after this
 * release would invalidate the entire payload. These tests pin the permissive
 * behaviour that prevents one new stock (or one new gift status) from taking
 * every caller down.
 */
describe("looseEnum forward compatibility", () => {
  const schema = looseEnum(["a", "b"]);

  it("accepts the documented values", () => {
    expect(schema.parse("a")).toBe("a");
    expect(schema.parse("b")).toBe("b");
  });

  it("accepts a value added after this release", () => {
    expect(schema.parse("c")).toBe("c");
  });

  it("still rejects non-strings and empty strings", () => {
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse(42).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });
});

describe("isKnownValue", () => {
  it("narrows documented values and rejects unknown ones", () => {
    expect(isKnownValue("JTTI", STOCK_IDS)).toBe(true);
    expect(isKnownValue("NEWCORP", STOCK_IDS)).toBe(false);
  });
});

describe("stockListResponseSchema tolerates a stock added by the API", () => {
  const baseStock = {
    name: "既存の会社",
    id: "JTTI",
    description: "desc",
    dividendAmount: 1000,
    dividendRate: 0.003,
    prices: [100, 101],
  };

  it("parses a list containing an unknown stock code", () => {
    const parsed = stockListResponseSchema.parse([
      baseStock,
      { ...baseStock, id: "NEWCORP", name: "新会社" },
    ]);

    expect(parsed).toHaveLength(2);
    expect(parsed[1]?.id).toBe("NEWCORP");
  });

  it("keeps the documented codes recognisable", () => {
    const parsed = stockListResponseSchema.parse([baseStock]);
    expect(isKnownValue(parsed[0]!.id, STOCK_IDS)).toBe(true);
  });

  it("still rejects a malformed stock entry", () => {
    expect(
      stockListResponseSchema.safeParse([{ ...baseStock, prices: "not-an-array" }]).success,
    ).toBe(false);
    expect(stockListResponseSchema.safeParse([{ ...baseStock, id: "" }]).success).toBe(false);
  });
});

describe("giftResponseSchema tolerates a status added by the API", () => {
  const baseGift = {
    type: "gift",
    id: "Abc123Xyz0",
    userId: "559948383079497729",
    status: "unused",
    receiverId: null,
    amount: 1000,
    boughtAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  it("parses the documented statuses", () => {
    expect(giftResponseSchema.parse(baseGift).status).toBe("unused");
    expect(giftResponseSchema.parse({ ...baseGift, status: "received" }).status).toBe("received");
  });

  it("parses a status added after this release", () => {
    const parsed = giftResponseSchema.parse({ ...baseGift, status: "expired" });
    expect(parsed.status).toBe("expired");
    expect(isKnownValue(parsed.status, GIFT_STATUSES)).toBe(false);
  });

  it("parses a gift type added after this release", () => {
    expect(giftResponseSchema.parse({ ...baseGift, type: "premium_gift" }).type).toBe(
      "premium_gift",
    );
    expect(GIFT_TYPES).toContain("gift");
  });

  it("still rejects a malformed gift", () => {
    expect(giftResponseSchema.safeParse({ ...baseGift, receiverId: "not-null-but" }).success).toBe(
      true,
    );
    expect(giftResponseSchema.safeParse({ ...baseGift, amount: "abc" }).success).toBe(false);
    expect(giftResponseSchema.safeParse({ ...baseGift, createdAt: "nope" }).success).toBe(false);
  });
});
