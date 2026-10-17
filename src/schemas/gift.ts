import { z } from "zod";
import { dateTimeSchema, int64Schema, laxObject, looseEnum } from "./common";

/** Gift object types declared by the OpenAPI document (`GiftResponse.type`). */
export const GIFT_TYPES = ["gift"] as const;

/** Gift states declared by the OpenAPI document (`GiftResponse.status`). */
export const GIFT_STATUSES = ["received", "unused"] as const;

/** `components.schemas.GiftResponse` — information about a single gift code. */
export const giftResponseSchema = laxObject(
  z.object({
    type: looseEnum(GIFT_TYPES),
    id: z.string(),
    userId: z.string(),
    status: looseEnum(GIFT_STATUSES),
    receiverId: z.string().nullable(),
    amount: int64Schema,
    boughtAt: dateTimeSchema.nullable(),
    createdAt: dateTimeSchema,
  }),
);

/** Response of `getGiftInfo()`. */
export type GiftResponse = z.infer<typeof giftResponseSchema>;
