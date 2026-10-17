import { requireNonEmptyString } from "../internal/validate";
import { historyResponseSchema } from "../schemas";
import type { HistoryEntry } from "../schemas";
import { request, type RequestContext } from "./fetcher";
import { API_PATHS, buildPath } from "./paths";

/**
 * Fetches the transaction history of a Discord user (`GET /v3/history/{id}`).
 *
 * @param context - Resolved client configuration (provided by `createToolKit`).
 * @param id - Discord user id.
 * @returns The transaction history, oldest first.
 * @throws {TakasumiBotToolkitValidationError} When `id` is empty or blank.
 * @throws {TakasumiBotToolkitHttpError} When the API answers with a non 2xx status.
 * @throws {TakasumiBotToolkitNetworkError} When the network fails.
 * @throws {TakasumiBotToolkitTimeoutError} When the request exceeds `timeoutMs`.
 * @throws {TakasumiBotToolkitResponseParseError} When a 2xx body is invalid.
 * @throws {TakasumiBotToolkitRetryLimitError} When retries are exhausted.
 *
 * @example
 * ```ts
 * const history = await kit.getHistoryById("123456789012345678");
 * console.log(history[0]?.amount); // bigint | undefined
 * ```
 */
export async function getHistoryById(context: RequestContext, id: string): Promise<HistoryEntry[]> {
  const userId = requireNonEmptyString(id, "id");
  return request(context, {
    method: "GET",
    path: buildPath(API_PATHS.historyById, { id: userId }),
    schema: historyResponseSchema,
  });
}
