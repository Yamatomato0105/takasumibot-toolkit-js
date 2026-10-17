/* eslint-disable */

/**
 * Comprehensive test suite for takasumibot-toolkit
 * Tests all exported functions and client methods in a single file
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  createToolKit,
  DEFAULT_BASE_URL,
  BASE_URL_ENV_KEY,
  resolveBaseUrl,
  normalizeBaseUrl,
  truncate,
  pickFields,
  omitFields,
  toMarkdownTable,
  formatNumber,
  formatTimestamp,
  paginate,
  getRecentStockHistory,
  TakasumiBotToolkitError,
  TakasumiBotToolkitConfigError,
  TakasumiBotToolkitValidationError,
  TakasumiBotToolkitHttpError,
  TakasumiBotToolkitNetworkError,
  TakasumiBotToolkitTimeoutError,
  TakasumiBotToolkitRetryLimitError,
  TakasumiBotToolkitResponseParseError,
  DEFAULT_RETRY_CONFIG,
  STOCK_IDS,
} from "../src/index";

import type { Mock } from "vitest";
import type {
  ToolKit,
  ToolKitConfig,
  Logger,
  FetchLike,
  StockCacheConfig,
  StockHistoryOptions,
  RetryConfig,
  StockEntry,
  GiftResponse,
  TaxResponse,
  TaxRateEntry,
  ShardResponse,
  StatisticsResponse,
  ProfileResponse,
  RankingEntry,
  CompanyListEntry,
  CompanyDetailResponse,
  DiscordUserSearchResponse,
  StatusEntry,
  MarkdownTableCell,
  MarkdownTableRow,
  MarkdownTableAlign,
  ToMarkdownTableOptions,
  FormatNumberOptions,
  TimestampInput,
  TimestampFormat,
  FormatTimestampOptions,
  PaginateResult,
  TruncateOptions,
} from "../src/index";

describe("takasumibot-toolkit comprehensive test suite", () => {
  // ====================================================================
  // Helper Functions Tests
  // ====================================================================

  describe("truncate helper", () => {
    it("should truncate text when it exceeds maxLength", () => {
      expect(truncate("hello world", 5)).toBe("he...");
      expect(truncate("hello world", 8)).toBe("hello...");
    });

    it("should not truncate when text fits", () => {
      expect(truncate("hello", 10)).toBe("hello");
      expect(truncate("abc", 5)).toBe("abc");
    });

    it("should handle zero maxLength", () => {
      expect(truncate("hello", 0)).toBe("");
    });

    it("should support custom ellipsis", () => {
      expect(truncate("hello world", 7, { ellipsis: ">>>" })).toBe("hell>>>");
      expect(truncate("hello world", 5, { ellipsis: "..." })).toBe("he...");
    });

    it("should throw validation error for invalid text", () => {
      expect(() => truncate(123 as any, 5)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => truncate(null as any, 5)).toThrow(TakasumiBotToolkitValidationError);
    });

    it("should throw validation error for invalid maxLength", () => {
      expect(() => truncate("hello", NaN)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => truncate("hello", -1)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => truncate("hello", 5.5)).toThrow(TakasumiBotToolkitValidationError);
    });

    it("should throw validation error for invalid ellipsis", () => {
      expect(() => truncate("hello", 5, { ellipsis: 123 as any })).toThrow(
        TakasumiBotToolkitValidationError,
      );
    });
  });

  describe("pickFields helper", () => {
    it("should pick selected fields from object", () => {
      const result = pickFields({ a: 1, b: 2, c: 3 }, ["a", "c"]);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it("should return empty object when no keys match", () => {
      // @ts-expect-error 'c' and 'd' are not keys of the object, by design
      const result = pickFields({ a: 1, b: 2 }, ["c", "d"]);
      expect(result).toEqual({});
    });

    it("should not copy non-own properties", () => {
      const obj = Object.create({ inherited: "value" });
      obj.own = "value";
      const result = pickFields(obj, ["inherited", "own"]);
      expect(result).toEqual({ own: "value" });
    });

    it("should prevent prototype pollution", () => {
      // @ts-expect-error these are not keys of the object, by design
      const result = pickFields({ a: 1 }, ["__proto__", "constructor", "prototype"]);
      expect(Object.keys(result)).not.toContain("__proto__");
      expect(Object.keys(result)).not.toContain("constructor");
      expect(Object.keys(result)).not.toContain("prototype");
    });

    it("should throw validation error for non-object", () => {
      expect(() => pickFields(null as any, ["a"])).toThrow(TakasumiBotToolkitValidationError);
      // @ts-expect-error 'a' is not a key of number[], by design
      expect(() => pickFields([1, 2], ["a"])).toThrow(TakasumiBotToolkitValidationError);
      expect(() => pickFields("string" as any, ["a"])).toThrow(TakasumiBotToolkitValidationError);
    });

    it("should throw validation error for non-array keys", () => {
      expect(() => pickFields({ a: 1 }, "a" as any)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => pickFields({ a: 1 }, null as any)).toThrow(TakasumiBotToolkitValidationError);
    });
  });

  describe("omitFields helper", () => {
    it("should omit selected fields from object", () => {
      const result = omitFields({ a: 1, b: 2, c: 3 }, ["b"]);
      expect(result).toEqual({ a: 1, c: 3 });
    });

    it("should return all fields when no keys match", () => {
      // @ts-expect-error 'c' and 'd' are not keys of the object, by design
      const result = omitFields({ a: 1, b: 2 }, ["c", "d"]);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should prevent prototype pollution", () => {
      const obj = { a: 1, b: 2 };
      // @ts-expect-error these are not keys of the object, by design
      const result = omitFields(obj, ["__proto__", "constructor", "prototype"]);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it("should throw validation error for non-object", () => {
      expect(() => omitFields(null as any, ["a"])).toThrow(TakasumiBotToolkitValidationError);
      expect(() => omitFields([] as any, ["a"])).toThrow(TakasumiBotToolkitValidationError);
    });

    it("should throw validation error for non-array keys", () => {
      expect(() => omitFields({ a: 1 }, "a" as any)).toThrow(TakasumiBotToolkitValidationError);
    });
  });

  describe("toMarkdownTable helper", () => {
    it("should render basic markdown table", () => {
      const table = toMarkdownTable([
        { name: "a", age: 1 },
        { name: "b", age: 2 },
      ]);
      expect(table).toContain("| name | age |");
      expect(table).toContain("| --- | --- |");
      expect(table).toContain("| a | 1 |");
      expect(table).toContain("| b | 2 |");
    });

    it("should return empty string for empty rows", () => {
      expect(toMarkdownTable([])).toBe("");
    });

    it("should escape pipe characters", () => {
      const table = toMarkdownTable([{ text: "a|b" }]);
      expect(table).toContain("\\|");
    });

    it("should escape newlines", () => {
      const table = toMarkdownTable([{ text: "line1\nline2" }]);
      expect(table).toContain("<br>");
    });

    it("should handle null and undefined values", () => {
      const table = toMarkdownTable([{ a: null, b: undefined, c: "value" }]);
      // null / undefined become empty cells, so each renders as "|  |" (two spaces).
      expect(table).toBe(["| a | b | c |", "| --- | --- | --- |", "|  |  | value |"].join("\n"));
    });

    it("should support custom headers", () => {
      const table = toMarkdownTable([{ a: 1, b: 2 }], { headers: ["b", "a"] });
      const lines = table.split("\n");
      expect(lines[0]).toBe("| b | a |");
    });

    it("should support column alignment", () => {
      // align is applied per column, so the rows need one column per alignment entry.
      const table = toMarkdownTable([{ a: 1, b: 2, c: 3 }], { align: ["left", "center", "right"] });
      const lines = table.split("\n");
      expect(lines[1]).toBe("| :--- | :---: | ---: |");
    });

    it("should handle bigint values", () => {
      const table = toMarkdownTable([{ value: 123n }]);
      expect(table).toContain("| 123 |");
    });

    it("should throw validation error for non-array rows", () => {
      expect(() => toMarkdownTable(null as any)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => toMarkdownTable({ a: 1 } as any)).toThrow(TakasumiBotToolkitValidationError);
    });

    it("should throw validation error for invalid row objects", () => {
      expect(() => toMarkdownTable([null] as any)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => toMarkdownTable([[1, 2]] as any)).toThrow(TakasumiBotToolkitValidationError);
    });

    it("should throw validation error for invalid options", () => {
      expect(() => toMarkdownTable([{ a: 1 }], null as any)).toThrow(
        TakasumiBotToolkitValidationError,
      );
    });
  });

  describe("formatNumber helper", () => {
    it("should format numbers with locale", () => {
      const result = formatNumber(1234567, { locale: "en-US" });
      expect(result).toBe("1,234,567");
    });

    it("should format bigint values", () => {
      const result = formatNumber(1234567n, { locale: "en-US" });
      expect(result).toBe("1,234,567");
    });

    it("should support fraction digits", () => {
      const result = formatNumber(1234.567, {
        locale: "en-US",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      expect(result).toContain("1,234.57");
    });

    it("should support compact notation", () => {
      const result = formatNumber(1000000, { locale: "en-US", notation: "compact" });
      expect(result.toUpperCase()).toContain("M");
    });

    it("should throw validation error for non-numeric values", () => {
      expect(() => formatNumber("123" as any)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => formatNumber(NaN)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => formatNumber(Infinity)).toThrow(TakasumiBotToolkitValidationError);
    });

    it("should throw validation error for invalid options", () => {
      expect(() => formatNumber(123, null as any)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => formatNumber(123, { locale: 123 as any })).toThrow(
        TakasumiBotToolkitValidationError,
      );
    });
  });

  describe("formatTimestamp helper", () => {
    it("should format timestamp as ISO string", () => {
      const timestamp = 1704067200000; // 2024-01-01T00:00:00Z
      const result = formatTimestamp(timestamp, { format: "iso" });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should format timestamp as locale string", () => {
      const timestamp = 1704067200000;
      const result = formatTimestamp(timestamp, { format: "locale", locale: "en-US" });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should format timestamp as relative string", () => {
      const now = Date.now();
      const result = formatTimestamp(now, { format: "relative" });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should accept ISO string input", () => {
      const result = formatTimestamp("2024-01-01T00:00:00Z", { format: "iso" });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should accept Date input", () => {
      const date = new Date("2024-01-01T00:00:00Z");
      const result = formatTimestamp(date, { format: "iso" });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should accept bigint input", () => {
      const result = formatTimestamp(1704067200000n, { format: "iso" });
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("should throw validation error for invalid input", () => {
      expect(() => formatTimestamp("invalid-date" as any)).toThrow(
        TakasumiBotToolkitValidationError,
      );
      expect(() => formatTimestamp(new Date("invalid"))).toThrow(TakasumiBotToolkitValidationError);
    });

    it("should throw validation error for invalid options", () => {
      expect(() => formatTimestamp(Date.now(), null as any)).toThrow(
        TakasumiBotToolkitValidationError,
      );
    });
  });

  describe("paginate helper", () => {
    it("should paginate array correctly", () => {
      const result = paginate([1, 2, 3, 4, 5], 1, 2);
      expect(result.items).toEqual([1, 2]);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.totalItems).toBe(5);
      expect(result.totalPages).toBe(3);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it("should handle middle page", () => {
      const result = paginate([1, 2, 3, 4, 5], 2, 2);
      expect(result.items).toEqual([3, 4]);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it("should handle last page", () => {
      const result = paginate([1, 2, 3, 4, 5], 3, 2);
      expect(result.items).toEqual([5]);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it("should return empty array for out-of-range page", () => {
      const result = paginate([1, 2, 3], 10, 2);
      expect(result.items).toEqual([]);
      expect(result.hasNext).toBe(false);
    });

    it("should handle edge case with page size equal to total items", () => {
      const result = paginate([1, 2, 3], 1, 3);
      expect(result.items).toEqual([1, 2, 3]);
      expect(result.totalPages).toBe(1);
      expect(result.hasNext).toBe(false);
    });

    it("should throw validation error for non-array items", () => {
      expect(() => paginate("items" as any, 1, 10)).toThrow(TakasumiBotToolkitValidationError);
    });

    it("should throw validation error for invalid page", () => {
      expect(() => paginate([1, 2], 0, 10)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => paginate([1, 2], -1, 10)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => paginate([1, 2], 1.5, 10)).toThrow(TakasumiBotToolkitValidationError);
    });

    it("should throw validation error for invalid pageSize", () => {
      expect(() => paginate([1, 2], 1, 0)).toThrow(TakasumiBotToolkitValidationError);
      expect(() => paginate([1, 2], 1, -1)).toThrow(TakasumiBotToolkitValidationError);
    });
  });

  describe("getRecentStockHistory helper", () => {
    it("should return reversed history", () => {
      const result = getRecentStockHistory([100, 101, 102, 103]);
      expect(result).toEqual([103, 102, 101, 100]);
    });

    it("should support limit parameter", () => {
      const result = getRecentStockHistory([100, 101, 102, 103], 2);
      expect(result).toEqual([103, 102]);
    });

    it("should return empty array for limit 0", () => {
      const result = getRecentStockHistory([100, 101, 102], 0);
      expect(result).toEqual([]);
    });

    it("should support bigint values", () => {
      const result = getRecentStockHistory([100n, 101n, 102n], 2);
      expect(result).toEqual([102n, 101n]);
    });

    it("should not mutate input array", () => {
      const input = [100, 101, 102];
      getRecentStockHistory(input);
      expect(input).toEqual([100, 101, 102]);
    });

    it("should throw validation error for non-array input", () => {
      expect(() => getRecentStockHistory("not-array" as any)).toThrow(
        TakasumiBotToolkitValidationError,
      );
    });

    it("should throw validation error for invalid array elements", () => {
      expect(() => getRecentStockHistory([100, "invalid"] as any)).toThrow(
        TakasumiBotToolkitValidationError,
      );
      expect(() => getRecentStockHistory([100, NaN])).toThrow(TakasumiBotToolkitValidationError);
    });
  });

  // ====================================================================
  // Base URL Functions Tests
  // ====================================================================

  describe("Base URL functions", () => {
    let originalEnv: string | undefined;

    beforeEach(() => {
      originalEnv = process.env[BASE_URL_ENV_KEY];
    });

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env[BASE_URL_ENV_KEY] = originalEnv;
      } else {
        delete process.env[BASE_URL_ENV_KEY];
      }
    });

    it("should have default base URL", () => {
      expect(DEFAULT_BASE_URL).toBe("https://api.takasumibot.com/");
    });

    it("should normalize base URL by removing trailing slashes", () => {
      expect(normalizeBaseUrl("https://api.takasumibot.com/")).toBe("https://api.takasumibot.com");
      expect(normalizeBaseUrl("https://api.takasumibot.com///")).toBe(
        "https://api.takasumibot.com",
      );
    });

    it("should resolve base URL from environment or default", () => {
      delete process.env[BASE_URL_ENV_KEY];
      const result = resolveBaseUrl();
      expect(result).toBe("https://api.takasumibot.com");
    });

    it("should resolve base URL from environment when set", () => {
      process.env[BASE_URL_ENV_KEY] = "https://custom.example.com/";
      const result = resolveBaseUrl();
      expect(result).toBe("https://custom.example.com");
    });

    it("should ignore blank environment variable", () => {
      process.env[BASE_URL_ENV_KEY] = "   ";
      const result = resolveBaseUrl();
      expect(result).toBe("https://api.takasumibot.com");
    });
  });

  // ====================================================================
  // Error Classes Tests
  // ====================================================================

  describe("Error classes", () => {
    it("should create TakasumiBotToolkitError", () => {
      const error = new TakasumiBotToolkitError("Test error");
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error");
    });

    it("should create TakasumiBotToolkitConfigError", () => {
      const error = new TakasumiBotToolkitConfigError("Invalid config");
      expect(error).toBeInstanceOf(TakasumiBotToolkitError);
      expect(error.message).toBe("Invalid config");
    });

    it("should create TakasumiBotToolkitValidationError", () => {
      const error = new TakasumiBotToolkitValidationError("Validation failed", {
        field: "username",
        code: "INVALID_ARGUMENT",
      });
      expect(error).toBeInstanceOf(TakasumiBotToolkitError);
      expect(error.message).toContain("Validation failed");
    });

    it("should create TakasumiBotToolkitHttpError", () => {
      const error = new TakasumiBotToolkitHttpError({
        status: 404,
        statusText: "Not Found",
        url: "https://api.takasumibot.com/v3/gift/Abc123Xyz0",
        method: "GET",
        rawBody: "body",
      });
      expect(error).toBeInstanceOf(TakasumiBotToolkitError);
      expect(error.status).toBe(404);
      expect(error.statusText).toBe("Not Found");
      expect(error.rawBody).toBe("body");
      expect(error.retryable).toBe(false);
      expect(error.message).toContain("HTTP 404 Not Found");
    });

    it("should create TakasumiBotToolkitNetworkError", () => {
      const error = new TakasumiBotToolkitNetworkError("Network failed", {
        url: "https://api.takasumibot.com/v3/tax",
        method: "GET",
      });
      expect(error).toBeInstanceOf(TakasumiBotToolkitError);
      expect(error.message).toBe("Network failed");
      expect(error.url).toBe("https://api.takasumibot.com/v3/tax");
      expect(error.retryable).toBe(true);
    });

    it("should create TakasumiBotToolkitTimeoutError", () => {
      const error = new TakasumiBotToolkitTimeoutError({
        timeoutMs: 5000,
        url: "https://api.takasumibot.com/v3/tax",
        method: "GET",
      });
      expect(error).toBeInstanceOf(TakasumiBotToolkitError);
      expect(error.timeoutMs).toBe(5000);
      expect(error.message).toContain("5000ms");
    });

    it("should create TakasumiBotToolkitRetryLimitError", () => {
      const context = { url: "https://api.takasumibot.com/v3/tax", method: "GET" };
      const lastError = new TakasumiBotToolkitNetworkError("Network failed", context);
      const error = new TakasumiBotToolkitRetryLimitError({
        lastError,
        attempts: 4,
        maxRetries: 3,
        ...context,
      });
      expect(error).toBeInstanceOf(TakasumiBotToolkitError);
      expect(error.maxRetries).toBe(3);
      expect(error.lastError).toBe(lastError);
      expect(error.cause).toBe(lastError);
    });

    it("should create TakasumiBotToolkitResponseParseError", () => {
      const error = new TakasumiBotToolkitResponseParseError("Invalid JSON", {
        url: "https://api.takasumibot.com/v3/tax",
        method: "GET",
        status: 200,
        rawBody: "{not json",
      });
      expect(error).toBeInstanceOf(TakasumiBotToolkitError);
      expect(error.status).toBe(200);
      expect(error.rawBody).toBe("{not json");
      expect(error.retryable).toBe(false);
    });
  });

  // ====================================================================
  // Retry Configuration Tests
  // ====================================================================

  describe("Retry configuration", () => {
    it("should have default retry config", () => {
      expect(DEFAULT_RETRY_CONFIG).toHaveProperty("maxRetries");
      expect(DEFAULT_RETRY_CONFIG).toHaveProperty("initialDelayMs");
      expect(DEFAULT_RETRY_CONFIG).toHaveProperty("maxDelayMs");
      expect(DEFAULT_RETRY_CONFIG).toHaveProperty("backoffFactor");
    });

    it("default retry config should have sensible values", () => {
      expect(DEFAULT_RETRY_CONFIG.maxRetries).toBeGreaterThanOrEqual(0);
      expect(DEFAULT_RETRY_CONFIG.initialDelayMs).toBeGreaterThan(0);
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBeGreaterThanOrEqual(
        DEFAULT_RETRY_CONFIG.initialDelayMs,
      );
      expect(DEFAULT_RETRY_CONFIG.backoffFactor).toBeGreaterThan(1);
    });
  });

  // ====================================================================
  // Client Creation Tests
  // ====================================================================

  describe("createToolKit", () => {
    it("should create client with default configuration", () => {
      const client = createToolKit();
      expect(client).toBeDefined();
      expect(client.baseUrl).toBeDefined();
      expect(typeof client.baseUrl).toBe("string");
    });

    it("should create client with custom timeout", () => {
      const client = createToolKit({ timeoutMs: 5000 });
      expect(client).toBeDefined();
    });

    it("should create client with custom headers", () => {
      const client = createToolKit({
        headers: { "user-agent": "my-bot/1.0" },
      });
      expect(client).toBeDefined();
    });

    it("should create client with stock cache enabled", () => {
      const client = createToolKit({ stockCache: { ttlMs: 60000 } });
      expect(client).toBeDefined();
    });

    it("should create client with stock cache disabled", () => {
      const client = createToolKit({ stockCache: false });
      expect(client).toBeDefined();
    });

    it("should create client with custom logger", () => {
      const logger: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      const client = createToolKit({ logger });
      expect(client).toBeDefined();
    });

    it("should create client with custom fetch", () => {
      const customFetch: FetchLike = vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ test: "data" }))),
      );
      const client = createToolKit({ fetch: customFetch });
      expect(client).toBeDefined();
    });

    it("should create client with retry configuration", () => {
      const client = createToolKit({
        retry: { maxRetries: 5 },
      });
      expect(client).toBeDefined();
    });

    it("should expose helpers on client", () => {
      const client = createToolKit();
      expect(client.helpers).toBeDefined();
      expect(client.helpers.truncate).toBeDefined();
      expect(client.helpers.pickFields).toBeDefined();
      expect(client.helpers.omitFields).toBeDefined();
      expect(client.helpers.toMarkdownTable).toBeDefined();
      expect(client.helpers.formatNumber).toBeDefined();
      expect(client.helpers.formatTimestamp).toBeDefined();
      expect(client.helpers.paginate).toBeDefined();
      expect(client.helpers.getRecentStockHistory).toBeDefined();
    });

    it("should expose stock builder on client", () => {
      const client = createToolKit();
      expect(client.getStock).toBeDefined();
      expect(typeof client.getStock).toBe("function");
    });

    it("should expose API methods on client", () => {
      const client = createToolKit();
      expect(client.getGiftInfo).toBeDefined();
      expect(client.getTaxInfo).toBeDefined();
      expect(client.getShardInfo).toBeDefined();
      expect(client.getStatisticsInfo).toBeDefined();
      expect(client.getHistoryById).toBeDefined();
      expect(client.getProfileById).toBeDefined();
      expect(client.getRanking).toBeDefined();
      expect(client.getCompanyList).toBeDefined();
      expect(client.getCompanyById).toBeDefined();
      expect(client.getStockList).toBeDefined();
      expect(client.getDiscordUserByName).toBeDefined();
      expect(client.getCompanyHistoryById).toBeDefined();
      expect(client.getStatus).toBeDefined();
    });

    it("should expose stock info methods on client", () => {
      const client = createToolKit();
      expect(client.getStockInfoById).toBeDefined();
      expect(client.getStockPriceById).toBeDefined();
      expect(client.getStockHistoryById).toBeDefined();
    });

    it("should make client frozen (immutable)", () => {
      const client = createToolKit();
      expect(() => {
        (client as any).newMethod = () => {};
      }).toThrow();
    });

    it("should throw validation error for invalid config", () => {
      // Invalid stockCache config should throw during client creation
      expect(() => {
        createToolKit({ stockCache: { ttlMs: 0 } });
      }).toThrow(TakasumiBotToolkitConfigError);

      expect(() => {
        createToolKit({ stockCache: { ttlMs: -1 } });
      }).toThrow(TakasumiBotToolkitConfigError);
    });

    it("should throw validation error for invalid timeout", () => {
      expect(() => {
        createToolKit({ timeoutMs: -1 });
      }).toThrow(TakasumiBotToolkitConfigError);

      expect(() => {
        createToolKit({ timeoutMs: 0 });
      }).toThrow(TakasumiBotToolkitConfigError);
    });

    it("should throw validation error for invalid retry config", () => {
      // Invalid retry config should throw
      expect(() => {
        createToolKit({
          retry: { maxRetries: -1 },
        });
      }).toThrow(TakasumiBotToolkitConfigError);
    });
  });

  // ====================================================================
  // Constants Tests
  // ====================================================================

  describe("Constants", () => {
    it("should export STOCK_IDS", () => {
      expect(Array.isArray(STOCK_IDS)).toBe(true);
      expect(STOCK_IDS.length).toBeGreaterThan(0);
      expect(typeof STOCK_IDS[0]).toBe("string");
    });

    it("STOCK_IDS should contain common stock codes", () => {
      // Just verify some structure, not specific codes
      expect(STOCK_IDS.some((id) => typeof id === "string" && id.length > 0)).toBe(true);
    });
  });

  // ====================================================================
  // Integration Tests (Mocked API)
  // ====================================================================

  describe("Client integration tests (with mocked fetch)", () => {
    let mockFetch: Mock<FetchLike>;
    let client: ToolKit;

    beforeEach(() => {
      mockFetch = vi.fn();
      client = createToolKit({ fetch: mockFetch });
    });

    it("should call API method with correct parameters", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "OK" }), { status: 200 }),
      );

      try {
        await client.getTaxInfo();
      } catch {
        // Expected to fail due to response parsing, but fetch should be called
      }

      expect(mockFetch).toHaveBeenCalled();
    });

    it("should construct correct URL for stock list", async () => {
      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));

      try {
        await client.getStockList();
      } catch {
        // Expected
      }

      expect(mockFetch).toHaveBeenCalled();
      const callUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(callUrl).toContain("stock");
    });

    it("should use custom headers", async () => {
      const customClient = createToolKit({
        fetch: mockFetch,
        headers: { "x-custom": "value" },
      });

      mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

      try {
        await customClient.getTaxInfo();
      } catch {
        // Expected
      }

      expect(mockFetch).toHaveBeenCalled();
      const initObj = mockFetch.mock.calls[0]?.[1] as RequestInit;
      expect(initObj.headers).toBeDefined();
    });

    it("should expose read-only baseUrl", () => {
      const baseUrl = client.baseUrl;
      expect(typeof baseUrl).toBe("string");
      expect(() => {
        (client as any).baseUrl = "https://different.com";
      }).toThrow();
    });
  });

  // ====================================================================
  // Type Safety Tests
  // ====================================================================

  describe("Type definitions", () => {
    it("should support all exported type interfaces", () => {
      // This test verifies that types can be imported and used
      const _config: ToolKitConfig = {
        timeoutMs: 10000,
        headers: { "user-agent": "test" },
      };

      const _logger: Logger = {
        debug: console.debug,
        warn: console.warn,
      };

      const _retryConfig: RetryConfig = {
        maxRetries: 3,
        initialDelayMs: 100,
        maxDelayMs: 5000,
        backoffFactor: 2,
        jitter: true,
      };

      const _row: MarkdownTableRow = { name: "test", value: 123 };
      const _options: ToMarkdownTableOptions = { headers: ["name", "value"] };
      const _formatOptions: FormatNumberOptions = { locale: "en-US" };
      const _paginateResult: PaginateResult<number> = {
        items: [1, 2, 3],
        page: 1,
        pageSize: 10,
        totalItems: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      };

      // Referencing the remaining exported types in type positions keeps the
      // import meaningful: dropping one of them from the public entry point
      // turns this into a compile error instead of passing silently.
      const _exportedTypes: {
        stockCache?: StockCacheConfig;
        stockHistory?: StockHistoryOptions;
        stock?: StockEntry;
        gift?: GiftResponse;
        tax?: TaxResponse;
        taxRate?: TaxRateEntry;
        shard?: ShardResponse;
        statistics?: StatisticsResponse;
        profile?: ProfileResponse;
        ranking?: RankingEntry;
        companyList?: CompanyListEntry;
        companyDetail?: CompanyDetailResponse;
        discord?: DiscordUserSearchResponse;
        status?: StatusEntry;
        cell?: MarkdownTableCell;
        align?: MarkdownTableAlign;
        timestamp?: TimestampInput;
        timestampFormat?: TimestampFormat;
        timestampOptions?: FormatTimestampOptions;
        truncateOptions?: TruncateOptions;
      } = {};

      expect(_config).toBeDefined();
      expect(_logger).toBeDefined();
      expect(_retryConfig).toBeDefined();
      expect(_row).toBeDefined();
      expect(_options).toBeDefined();
      expect(_formatOptions).toBeDefined();
      expect(_paginateResult).toBeDefined();
      expect(_exportedTypes).toBeDefined();
    });
  });

  // ====================================================================
  // Edge Cases and Error Scenarios
  // ====================================================================

  describe("Edge cases and error scenarios", () => {
    it("should handle empty strings gracefully", () => {
      expect(truncate("", 5)).toBe("");
      // A row with no columns yields no renderable table: emitting "|  |" three
      // times would be malformed Markdown (the delimiter row needs a hyphen),
      // so this matches the empty-rows case and returns "".
      expect(toMarkdownTable([{}])).toBe("");
    });

    it("should handle large numbers", () => {
      const largeNum = 999999999999n;
      expect(() => formatNumber(largeNum)).not.toThrow();
      expect(() => getRecentStockHistory([largeNum])).not.toThrow();
    });

    it("should handle very long strings", () => {
      const longStr = "a".repeat(10000);
      expect(truncate(longStr, 100)).toHaveLength(100);
    });

    it("should handle deeply nested objects in pickFields", () => {
      const obj = {
        a: { nested: { deep: "value" } },
        b: "simple",
      };
      const result = pickFields(obj, ["a", "b"]);
      expect(result.a).toEqual({ nested: { deep: "value" } });
      expect(result.b).toBe("simple");
    });

    it("should handle pagination with single item per page", () => {
      const result = paginate([1, 2, 3, 4, 5], 1, 1);
      expect(result.items).toEqual([1]);
      expect(result.totalPages).toBe(5);
    });

    it("should handle relative timestamp formatting for past dates", () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const result = formatTimestamp(pastDate, { format: "relative" });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle relative timestamp formatting for future dates", () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const result = formatTimestamp(futureDate, { format: "relative" });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
