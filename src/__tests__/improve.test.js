import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("improve / logError", () => {
  let logError, logWarn, logInfo;

  beforeEach(async () => {
    // Re-import fresh module each test to reset _recentFps Map
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    vi.stubGlobal("navigator", { userAgent: "vitest/1.0" });
    window.location.hash = "";
    window.location.pathname = "/";
    ({ logError, logWarn, logInfo } = await import("../utils/improve.js"));
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("sends a POST to /improve-log", async () => {
    await logError("test", "something failed");
    expect(fetch).toHaveBeenCalledWith("/improve-log", expect.objectContaining({ method: "POST" }));
  });

  it("deduplicates identical errors within 60s", async () => {
    await logError("test", "duplicate error");
    await logError("test", "duplicate error");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("sends both calls for different error types", async () => {
    await logError("error", "message");
    await logError("warning", "message");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("includes fingerprint in payload", async () => {
    await logError("error", "test message");
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.fingerprint).toBeDefined();
    expect(body.fingerprint).toContain("error::");
  });

  it("normalises URLs in fingerprint", async () => {
    await logError("error", "failed: https://example.com/path?q=1");
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.fingerprint).toContain("<url>");
    expect(body.fingerprint).not.toContain("example.com");
  });

  it("normalises numbers in fingerprint", async () => {
    await logError("error", "retry 3 failed after 500ms");
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.fingerprint).not.toMatch(/\d+/);
  });

  it("logWarn sends type=warning", async () => {
    await logWarn("something slow");
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.type).toBe("warning");
  });

  it("logInfo sends type=info", async () => {
    await logInfo("startup complete");
    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.type).toBe("info");
  });

  it("does not throw when fetch fails", async () => {
    fetch.mockRejectedValue(new Error("network down"));
    await expect(logError("error", "test")).resolves.toBeUndefined();
  });
});
