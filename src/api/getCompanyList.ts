import { companyListResponseSchema } from "../schemas";
import type { CompanyListEntry } from "../schemas";
import { request, type RequestContext } from "./fetcher";
import { API_PATHS } from "./paths";

/**
 * Fetches the list of companies (`GET /v3/companylist/`).
 *
 * @param context - Resolved client configuration (provided by `createToolKit`).
 * @returns Every registered company.
 * @throws {TakasumiBotToolkitHttpError} When the API answers with a non 2xx status.
 * @throws {TakasumiBotToolkitNetworkError} When the network fails.
 * @throws {TakasumiBotToolkitTimeoutError} When the request exceeds `timeoutMs`.
 * @throws {TakasumiBotToolkitResponseParseError} When a 2xx body is invalid.
 * @throws {TakasumiBotToolkitRetryLimitError} When retries are exhausted.
 *
 * @example
 * ```ts
 * const companies = await kit.getCompanyList();
 * console.log(companies.length);
 * ```
 */
export async function getCompanyList(context: RequestContext): Promise<CompanyListEntry[]> {
  return request(context, {
    method: "GET",
    path: API_PATHS.companyList,
    schema: companyListResponseSchema,
  });
}
