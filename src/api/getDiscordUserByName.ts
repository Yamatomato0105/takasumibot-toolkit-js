import { requireNonEmptyString } from "../internal/validate";
import { discordUserSearchResponseSchema } from "../schemas";
import type { DiscordUserSearchResponse } from "../schemas";
import { request, type RequestContext } from "./fetcher";
import { API_PATHS, buildPath } from "./paths";

/**
 * Looks up a Discord user by name (`GET /v3/discord/usersearch/{name}`).
 *
 * @param context - Resolved client configuration (provided by `createToolKit`).
 * @param name - Discord username. It is trimmed before validation and URL
 *   encoded before being placed in the path.
 * @returns The Discord user.
 * @throws {TakasumiBotToolkitValidationError} When `name` is empty or blank.
 * @throws {TakasumiBotToolkitHttpError} When the API answers with a non 2xx status.
 * @throws {TakasumiBotToolkitNetworkError} When the network fails.
 * @throws {TakasumiBotToolkitTimeoutError} When the request exceeds `timeoutMs`.
 * @throws {TakasumiBotToolkitResponseParseError} When a 2xx body is invalid.
 * @throws {TakasumiBotToolkitRetryLimitError} When retries are exhausted.
 *
 * @example
 * ```ts
 * const user = await kit.getDiscordUserByName("takasumi");
 * console.log(user.globalName, user.bot);
 * ```
 */
export async function getDiscordUserByName(
  context: RequestContext,
  name: string,
): Promise<DiscordUserSearchResponse> {
  const username = requireNonEmptyString(name, "name");
  return request(context, {
    method: "GET",
    path: buildPath(API_PATHS.discordUserByName, { name: username }),
    schema: discordUserSearchResponseSchema,
  });
}
