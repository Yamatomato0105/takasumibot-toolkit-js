import { z } from "zod";

/**
 * Wraps an object schema so that unknown keys are **preserved** instead of being
 * stripped (zod `passthrough`).
 *
 * The returned schema validates exactly like the input one, but keeps every
 * additional property the API may add in the future, so a new field never
 * breaks an existing integration.
 *
 * The declared output type is intentionally the *clean* object type (without an
 * index signature) so that the public SDK types stay readable; the runtime
 * value simply carries extra properties.
 *
 * @param schema - Object schema to relax.
 * @returns A schema with the same output type that passes unknown keys through.
 *
 * @example
 * ```ts
 * const schema = laxObject(z.object({ a: z.string() }));
 * schema.parse({ a: "x", b: 1 }); // { a: "x", b: 1 }
 * ```
 */
export function laxObject<S extends z.ZodObject<z.ZodRawShape>>(
  schema: S,
): z.ZodType<z.infer<S>, z.ZodTypeDef, unknown> {
  // The cast is safe: `.passthrough()` only widens the *runtime* output with
  // extra unknown properties, which the declared type deliberately omits so
  // that `keyof` stays a finite union of the documented fields.
  return schema.passthrough() as unknown as z.ZodType<z.infer<S>, z.ZodTypeDef, unknown>;
}

const INTEGER_STRING = /^-?\d+$/;

/** Accepts `bigint`, an integer `number`, or a decimal string, and yields a `bigint`. */
const intLikeSchema = z.union([
  z.number().int(),
  z.bigint(),
  z.string().regex(INTEGER_STRING, "Expected an integer-like value"),
]);

/**
 * Schema for OpenAPI `type: integer, format: int64`.
 *
 * Accepts a `bigint` (produced by {@link parseJsonWithBigInt} for values beyond
 * the safe integer range), a safe integer `number`, or a decimal `string`, and
 * always yields a `bigint` so no precision is lost.
 *
 * @example
 * ```ts
 * int64Schema.parse(9007199254740993n); // 9007199254740993n
 * int64Schema.parse(42); // 42n
 * ```
 */
export const int64Schema = intLikeSchema.transform((value) =>
  typeof value === "bigint" ? value : BigInt(value),
);

/**
 * Schema for OpenAPI `type: integer, format: int32`.
 *
 * @example
 * ```ts
 * int32Schema.parse(42); // 42
 * ```
 */
export const int32Schema = intLikeSchema.transform((value) => Number(value));

/**
 * A permissive stand-in for OpenAPI `enum`.
 *
 * A strict `z.enum` rejects any value the API adds after this release, and
 * because a response is validated as a whole, **one** new value invalidates the
 * entire payload (a single new stock would break `getStockList()` for every
 * caller). Since the OpenAPI document is a snapshot rather than a contract the
 * API is frozen to, enums are validated as "a non-empty string" instead.
 *
 * The inferred type stays `T | (string & {})`, so editors keep autocompleting
 * the documented values while unknown ones still type-check. Narrow with
 * {@link isKnownValue} where the exact set matters.
 *
 * @param values - The values declared by the OpenAPI document.
 * @returns A schema accepting any non-empty string, typed as `T | string`.
 *
 * @example
 * ```ts
 * const statusSchema = looseEnum(["received", "unused"]);
 * statusSchema.parse("received"); // "received"
 * statusSchema.parse("expired"); // "expired" — a value added later
 * ```
 */
export function looseEnum<T extends string>(values: readonly T[]) {
  return z
    .string()
    .min(1)
    .describe(`Documented values: ${values.join(" | ")}. Other values are accepted.`)
    .transform((value): T | (string & {}) => value);
}

/** Type guard narrowing a `looseEnum` result back to its documented values. */
export function isKnownValue<T extends string>(value: string, known: readonly T[]): value is T {
  return (known as readonly string[]).includes(value);
}

/** Schema for OpenAPI `type: number` (any finite JSON number). */
export const numberSchema = z.number();

/**
 * Schema for OpenAPI `type: string, format: date-time`.
 *
 * Validation is intentionally permissive (anything `Date` can parse) because
 * the API is free to emit an offset instead of `Z`.
 */
export const dateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Invalid date-time string" });
