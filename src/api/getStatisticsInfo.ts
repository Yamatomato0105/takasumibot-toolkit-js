import { statisticsResponseSchema } from "../schemas";
import type { StatisticsResponse } from "../schemas";
import { request, type RequestContext } from "./fetcher";
import { API_PATHS } from "./paths";

/**
 * Fetches the global bot statistics (`GET /v3/statistics/`).
 *
 * @param context - Resolved client configuration (provided by `createToolKit`).
 * @returns User, company, economy and event statistics.
 * @throws {TakasumiBotToolkitHttpError} When the API answers with a non 2xx status.
 * @throws {TakasumiBotToolkitNetworkError} When the network fails.
 * @throws {TakasumiBotToolkitTimeoutError} When the request exceeds `timeoutMs`.
 * @throws {TakasumiBotToolkitResponseParseError} When a 2xx body is invalid.
 * @throws {TakasumiBotToolkitRetryLimitError} When retries are exhausted.
 *
 * @example
 * ```ts
 * const stats = await kit.getStatisticsInfo();
 * console.log(stats.economy.treasury); // bigint
 * ```
 */
export async function getStatisticsInfo(context: RequestContext): Promise<StatisticsResponse> {
  return request(context, {
    method: "GET",
    path: API_PATHS.statistics,
    schema: statisticsResponseSchema,
  });
}
