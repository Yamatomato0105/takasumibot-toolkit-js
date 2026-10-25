import { describe, expect, it } from "vitest";
import {
  isRetryableStatus,
  TakasumiBotToolkitConfigError,
  TakasumiBotToolkitError,
  TakasumiBotToolkitHttpError,
  TakasumiBotToolkitNetworkError,
  TakasumiBotToolkitResponseParseError,
  TakasumiBotToolkitRetryLimitError,
  TakasumiBotToolkitTimeoutError,
  TakasumiBotToolkitValidationError,
} from "../../../src/errors";

const context = { url: "https://api.takasumibot.com/v3/tax", method: "GET" };

const allErrors = [
  new TakasumiBotToolkitError("base"),
  new TakasumiBotToolkitConfigError("config", { field: "timeoutMs", value: -1 }),
  new TakasumiBotToolkitValidationError("validation", { field: "id", code: "INVALID_GIFT_ID" }),
  new TakasumiBotToolkitHttpError({ status: 500, ...context }),
  new TakasumiBotToolkitNetworkError("network", context),
  new TakasumiBotToolkitTimeoutError({ timeoutMs: 10, ...context }),
  new TakasumiBotToolkitRetryLimitError({
    lastError: new TakasumiBotToolkitNetworkError("network", context),
    attempts: 4,
    maxRetries: 3,
    ...context,
  }),
  new TakasumiBotToolkitResponseParseError("parse", context),
];

describe("errors", () => {
  it("exposes all eight classes deriving from TakasumiBotToolkitError and Error", () => {
    for (const error of allErrors) {
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(TakasumiBotToolkitError);
    }
    expect(allErrors).toHaveLength(8);
  });

  it("sets name to the class name", () => {
    for (const error of allErrors) {
      expect(error.name).toBe(error.constructor.name);
    }
    expect(new TakasumiBotToolkitHttpError({ status: 404, ...context }).name).toBe(
      "TakasumiBotToolkitHttpError",
    );
  });

  it("keeps the cause", () => {
    const cause = new Error("root cause");
    const error = new TakasumiBotToolkitNetworkError("network", context, { cause });
    expect(error.cause).toBe(cause);
  });

  it("reports the documented retryable flags", () => {
    expect(new TakasumiBotToolkitConfigError("config").retryable).toBe(false);
    expect(new TakasumiBotToolkitValidationError("validation").retryable).toBe(false);
    expect(new TakasumiBotToolkitResponseParseError("parse", context).retryable).toBe(false);
    expect(new TakasumiBotToolkitNetworkError("network", context).retryable).toBe(true);
    expect(new TakasumiBotToolkitTimeoutError({ timeoutMs: 1, ...context }).retryable).toBe(true);
    expect(new TakasumiBotToolkitHttpError({ status: 429, ...context }).retryable).toBe(true);
    expect(new TakasumiBotToolkitHttpError({ status: 404, ...context }).retryable).toBe(false);
  });

  it("exposes the HTTP error context", () => {
    const error = new TakasumiBotToolkitHttpError({
      status: 404,
      statusText: "Not Found",
      ...context,
      headers: { "x-request-id": "req-42" },
      body: { code: "NOT_FOUND" },
      rawBody: '{"code":"NOT_FOUND"}',
      code: "NOT_FOUND",
      requestId: "req-42",
    });
    expect(error).toMatchObject({
      status: 404,
      statusText: "Not Found",
      url: context.url,
      method: "GET",
      code: "NOT_FOUND",
      requestId: "req-42",
      rawBody: '{"code":"NOT_FOUND"}',
    });
    expect(error.message).toContain("HTTP 404 Not Found");
  });

  it("keeps the validation error details", () => {
    const error = new TakasumiBotToolkitValidationError("bad limit", {
      field: "limit",
      value: -1,
      code: "INVALID_LIMIT",
    });
    expect(error.field).toBe("limit");
    expect(error.value).toBe(-1);
    expect(error.code).toBe("INVALID_LIMIT");
  });

  it("keeps the retry limit details", () => {
    const lastError = new TakasumiBotToolkitTimeoutError({ timeoutMs: 10, ...context });
    const error = new TakasumiBotToolkitRetryLimitError({
      lastError,
      attempts: 4,
      maxRetries: 3,
      ...context,
    });
    expect(error.attempts).toBe(4);
    expect(error.maxRetries).toBe(3);
    expect(error.lastError).toBe(lastError);
    expect(error.cause).toBe(lastError);
    expect(error.message).toContain("after 4 attempts");
  });

  it("keeps the zod issues on a parse error", () => {
    const error = new TakasumiBotToolkitResponseParseError("bad schema", {
      ...context,
      status: 200,
      zodIssues: [
        {
          code: "invalid_type",
          expected: "string",
          input: 42,
          path: ["a"],
          message: "Expected string",
        },
      ],
    });
    expect(error.status).toBe(200);
    expect(error.zodIssues).toHaveLength(1);
  });

  it("flags 429 and 5xx gateway statuses as retryable", () => {
    for (const status of [429, 500, 502, 503, 504]) {
      expect(isRetryableStatus(status)).toBe(true);
    }
    for (const status of [400, 401, 403, 404, 418, 501]) {
      expect(isRetryableStatus(status)).toBe(false);
    }
  });
});
