/**
 * `takasumibot-toolkit` — a strict, dependency-light TypeScript client for the
 * TakasumiBOT public API (v3).
 *
 * The OpenAPI document shipped in this repository
 * (`TakasumiBOT-OpenAPI-Document.json`) is the single source of truth: every
 * method of {@link ToolKit} maps to one declared HTTP path, and the
 * WebSocket endpoint `/v3/realtime/` is intentionally not implemented.
 *
 * @example
 * ```ts
 * import { createToolKit } from "takasumibot-toolkit";
 *
 * const kit = createToolKit({ timeoutMs: 10_000 });
 * const stocks = await kit.getStockList();
 * const price = await kit.getStock().id("JTTI").price();
 * ```
 *
 * @packageDocumentation
 */

export { createToolKit } from "./client/createToolKit";
export {
  DEFAULT_BASE_URL,
  BASE_URL_ENV_KEY,
  resolveBaseUrl,
  normalizeBaseUrl,
} from "./client/baseUrl";

export type {
  ToolKit,
  ToolKitConfig,
  Logger,
  FetchLike,
  StockCacheConfig,
  StockHistoryOptions,
} from "./client/types";

export type { RetryConfig } from "./retry";
export { DEFAULT_RETRY_CONFIG } from "./retry";

export {
  TakasumiBotToolkitError,
  TakasumiBotToolkitConfigError,
  TakasumiBotToolkitValidationError,
  TakasumiBotToolkitHttpError,
  TakasumiBotToolkitNetworkError,
  TakasumiBotToolkitTimeoutError,
  TakasumiBotToolkitRetryLimitError,
  TakasumiBotToolkitResponseParseError,
} from "./errors";
export type { TakasumiBotToolkitErrorOptions } from "./errors";
export type { TakasumiBotToolkitValidationErrorCode } from "./errors";

export type { StockBuilder, StockIdBuilder } from "./stock";

export type {
  GiftResponse,
  TaxResponse,
  TaxRateEntry,
  ShardResponse,
  ShardDataEntry,
  StatisticsResponse,
  HistoryEntry,
  ProfileResponse,
  RankingEntry,
  CompanyListEntry,
  CompanyEmployeeEntry,
  CompanyStatistics,
  CompanyDetailResponse,
  CompanyHistoryEntry,
  StockEntry,
  StockId,
  DiscordUserSearchResponse,
  StatusEntry,
} from "./schemas";
export { STOCK_IDS, GIFT_TYPES, GIFT_STATUSES, isKnownValue } from "./schemas";

export {
  truncate,
  pickFields,
  omitFields,
  toMarkdownTable,
  formatNumber,
  formatTimestamp,
  paginate,
  getRecentStockHistory,
} from "./helpers";
export type { Helpers } from "./helpers";
export type {
  TruncateOptions,
  MarkdownTableCell,
  MarkdownTableRow,
  MarkdownTableAlign,
  ToMarkdownTableOptions,
  FormatNumberOptions,
  TimestampInput,
  TimestampFormat,
  FormatTimestampOptions,
  PaginateResult,
} from "./helpers";
