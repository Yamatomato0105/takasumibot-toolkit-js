import { z } from "zod";
import { int64Schema, laxObject, looseEnum, numberSchema } from "./common";

/** Stock codes listed in the OpenAPI document (`StockEntry.id` enum). */
export const STOCK_IDS = [
  "JTTI",
  "TENOMU",
  "KAKAPO",
  "TOMOTA",
  "NITIMOTO",
  "DEEDLE",
  "RIPPLE",
  "NIMURA",
  "TAKASUMI",
  "KENTAI",
] as const;

/** Union of every known stock code. */
export type StockId = (typeof STOCK_IDS)[number];

/**
 * `components.schemas.StockEntry` — one listed stock.
 *
 * `prices` is **ascending in time**: the last element is the newest price.
 * `dividendAmount` and `prices` are `format: int64` and are therefore
 * exposed as `bigint`.
 */
export const stockEntrySchema = laxObject(
  z.object({
    name: z.string(),
    id: looseEnum(STOCK_IDS),
    description: z.string(),
    dividendAmount: int64Schema,
    dividendRate: numberSchema,
    prices: z.array(int64Schema),
  }),
);

/** One entry returned by `getStockList()`. */
export type StockEntry = z.infer<typeof stockEntrySchema>;

/** Response body of `getStockList()` (`StockEntry[]`). */
export const stockListResponseSchema = z.array(stockEntrySchema);
