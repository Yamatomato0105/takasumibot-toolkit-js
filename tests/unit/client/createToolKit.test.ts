import { afterEach, describe, expect, it, vi } from "vitest";
import { createToolKit } from "../../../src/client/createToolKit";
import { TakasumiBotToolkitConfigError } from "../../../src/errors";
import { createMockFetch } from "../../helpers/mockFetch";
import { taxResponse } from "../../helpers/fixtures";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createToolKit", () => {
  it("applies the documented defaults", () => {
    const fetch = createMockFetch([{ body: taxResponse }]);
    const kit = createToolKit({ fetch });
    expect(kit.baseUrl).toBe("https://api.takasumibot.com");
    expect(kit.helpers.truncate).toBeTypeOf("function");
  });

  it("exposes baseUrl as read-only", () => {
    const kit = createToolKit({ fetch: createMockFetch([{ body: taxResponse }]) });
    expect(() => {
      // @ts-expect-error -- baseUrl is readonly on purpose
      kit.baseUrl = "https://evil.test";
    }).toThrowError();
    expect(kit.baseUrl).toBe("https://api.takasumibot.com");
  });

  it("uses TAKASUMIBOT_BASE_URL for the requests", async () => {
    vi.stubEnv("TAKASUMIBOT_BASE_URL", "https://example.test/root/");
    const fetch = createMockFetch([{ body: taxResponse }]);
    const kit = createToolKit({ fetch });
    expect(kit.baseUrl).toBe("https://example.test/root");

    await kit.getTaxInfo();
    expect(fetch.lastUrl).toBe("https://example.test/root/v3/tax");
  });

  it("merges custom headers into every request (user headers win)", async () => {
    const fetch = createMockFetch([{ body: taxResponse }]);
    const kit = createToolKit({ fetch, headers: { "user-agent": "my-bot/1.0" } });

    await kit.getTaxInfo();
    expect(fetch.calls[0]?.init?.headers).toMatchObject({
      "user-agent": "my-bot/1.0",
      accept: "application/json",
    });
  });

  it("sends the default Accept header", async () => {
    const fetch = createMockFetch([{ body: taxResponse }]);
    const kit = createToolKit({ fetch });

    await kit.getTaxInfo();

    expect(new Headers(fetch.calls[0]?.init?.headers).get("accept")).toBe("application/json");
  });

  it("lets a lowercase accept header replace the default", async () => {
    const fetch = createMockFetch([{ body: taxResponse }]);
    const kit = createToolKit({ fetch, headers: { accept: "application/custom" } });

    await kit.getTaxInfo();

    expect(new Headers(fetch.calls[0]?.init?.headers).get("accept")).toBe("application/custom");
  });

  it("lets a case-insensitive Accept header replace the default", async () => {
    const fetch = createMockFetch([{ body: taxResponse }]);
    const kit = createToolKit({ fetch, headers: { Accept: "application/custom" } });

    await kit.getTaxInfo();

    expect(new Headers(fetch.calls[0]?.init?.headers).get("accept")).toBe("application/custom");
  });

  it("preserves headers that do not conflict with the default", async () => {
    const fetch = createMockFetch([{ body: taxResponse }]);
    const kit = createToolKit({ fetch, headers: { "user-agent": "my-bot/1.0" } });

    await kit.getTaxInfo();

    const headers = new Headers(fetch.calls[0]?.init?.headers);
    expect(headers.get("user-agent")).toBe("my-bot/1.0");
    expect(headers.get("accept")).toBe("application/json");
  });

  it("rejects an invalid timeoutMs", () => {
    expect(() => createToolKit({ timeoutMs: 0 })).toThrowError(TakasumiBotToolkitConfigError);
    expect(() => createToolKit({ timeoutMs: -1 })).toThrowError(TakasumiBotToolkitConfigError);
    expect(() => createToolKit({ timeoutMs: Number.NaN })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
  });

  it("rejects invalid retry settings", () => {
    expect(() => createToolKit({ retry: { maxRetries: -1 } })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
    expect(() => createToolKit({ retry: { maxRetries: 1.5 } })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
    expect(() => createToolKit({ retry: { backoffFactor: 0 } })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
    expect(() => createToolKit({ retry: { jitter: "yes" as unknown as boolean } })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
  });

  it("throws a ConfigError when initialDelayMs > maxDelayMs", () => {
    expect(() => createToolKit({ retry: { initialDelayMs: 5000, maxDelayMs: 1000 } })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
  });

  it("rejects an invalid fetch, headers, logger and stockCache", () => {
    expect(() => createToolKit({ fetch: "nope" as never })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
    expect(() => createToolKit({ headers: [] as never })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
    expect(() => createToolKit({ logger: { warn: "nope" as never } })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
    expect(() => createToolKit({ stockCache: { ttlMs: 0 } })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
    expect(() => createToolKit({ stockCache: { ttlMs: -5 } })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
    expect(() => createToolKit({ stockCache: true as never })).toThrowError(
      TakasumiBotToolkitConfigError,
    );
  });

  it("exposes the error field when the configuration is invalid", () => {
    try {
      createToolKit({ timeoutMs: -1 });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(TakasumiBotToolkitConfigError);
      const configError = error as TakasumiBotToolkitConfigError;
      expect(configError.field).toBe("timeoutMs");
      expect(configError.value).toBe(-1);
      expect(configError.retryable).toBe(false);
    }
  });

  it("does not fire any request when only the builder is created", () => {
    const fetch = createMockFetch([{ body: [] }]);
    const kit = createToolKit({ fetch });
    const builder = kit.getStock().id("JTTI");
    expect(builder).toBeDefined();
    expect(fetch.callCount).toBe(0);
  });
});
