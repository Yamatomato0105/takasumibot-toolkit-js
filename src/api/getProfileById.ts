import { requireNonEmptyString } from "../internal/validate";
import { profileResponseSchema } from "../schemas";
import type { ProfileResponse } from "../schemas";
import { request, type RequestContext } from "./fetcher";
import { API_PATHS, buildPath } from "./paths";

/**
 * Fetches the profile of a Discord user (`GET /v3/profile/{id}`).
 *
 * @param context - Resolved client configuration (provided by `createToolKit`).
 * @param id - Discord user id.
 * @returns Assets, chips and job of the user.
 * @throws {TakasumiBotToolkitValidationError} When `id` is empty or blank.
 * @throws {TakasumiBotToolkitHttpError} When the API answers with a non 2xx status.
 * @throws {TakasumiBotToolkitNetworkError} When the network fails.
 * @throws {TakasumiBotToolkitTimeoutError} When the request exceeds `timeoutMs`.
 * @throws {TakasumiBotToolkitResponseParseError} When a 2xx body is invalid.
 * @throws {TakasumiBotToolkitRetryLimitError} When retries are exhausted.
 *
 * @example
 * ```ts
 * const profile = await kit.getProfileById("123456789012345678");
 * console.log(profile.assets); // bigint
 * ```
 */
export async function getProfileById(
  context: RequestContext,
  id: string,
): Promise<ProfileResponse> {
  const userId = requireNonEmptyString(id, "id");
  return request(context, {
    method: "GET",
    path: buildPath(API_PATHS.profileById, { id: userId }),
    schema: profileResponseSchema,
  });
}
