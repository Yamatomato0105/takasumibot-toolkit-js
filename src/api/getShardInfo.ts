import { shardResponseSchema } from "../schemas";
import type { ShardResponse } from "../schemas";
import { request, type RequestContext } from "./fetcher";
import { API_PATHS } from "./paths";

/**
 * Fetches the shard snapshot (`GET /v3/shard/`).
 *
 * @param context - Resolved client configuration (provided by `createToolKit`).
 * @returns Per shard counters and the time they were logged.
 * @throws {TakasumiBotToolkitHttpError} When the API answers with a non 2xx status.
 * @throws {TakasumiBotToolkitNetworkError} When the network fails.
 * @throws {TakasumiBotToolkitTimeoutError} When the request exceeds `timeoutMs`.
 * @throws {TakasumiBotToolkitResponseParseError} When a 2xx body is invalid.
 * @throws {TakasumiBotToolkitRetryLimitError} When retries are exhausted.
 *
 * @example
 * ```ts
 * const shard = await kit.getShardInfo();
 * console.log(shard.data.length, shard.loggedAt);
 * ```
 */
export async function getShardInfo(context: RequestContext): Promise<ShardResponse> {
  return request(context, { method: "GET", path: API_PATHS.shard, schema: shardResponseSchema });
}
