import { taxResponseSchema } from "../schemas";
import type { TaxResponse } from "../schemas";
import { request, type RequestContext } from "./fetcher";
import { API_PATHS } from "./paths";

/**
 * Fetches every tax rate and interest rate (`GET /v3/tax/`).
 *
 * @param context - Resolved client configuration (provided by `createToolKit`).
 * @returns The tax information.
 * @throws {TakasumiBotToolkitHttpError} When the API answers with a non 2xx status.
 * @throws {TakasumiBotToolkitNetworkError} When the network fails.
 * @throws {TakasumiBotToolkitTimeoutError} When the request exceeds `timeoutMs`.
 * @throws {TakasumiBotToolkitResponseParseError} When a 2xx body is invalid.
 * @throws {TakasumiBotToolkitRetryLimitError} When retries are exhausted.
 *
 * @example
 * ```ts
 * const tax = await kit.getTaxInfo();
 * console.log(tax.incomeTaxRate, tax.idleTax); // number, bigint
 * ```
 */
export async function getTaxInfo(context: RequestContext): Promise<TaxResponse> {
  return request(context, { method: "GET", path: API_PATHS.tax, schema: taxResponseSchema });
}
