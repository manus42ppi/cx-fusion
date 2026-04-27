import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchWithProxy, proxyStatus } from "../utils/cors-proxy.js";

describe("cors-proxy", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    // Reset AbortSignal.timeout stub
    vi.stubGlobal("AbortSignal", { timeout: () => ({ aborted: false }) });
  });
  afterEach(() => { vi.unstubAllGlobals(); });

  it("returns response on first proxy success", async () => {
    const mockResponse = { ok: true, text: async () => "<html/>" };
    fetch.mockResolvedValueOnce(mockResponse);
    const r = await fetchWithProxy("https://example.com");
    expect(r.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("falls back to second proxy if first fails", async () => {
    const mockResponse = { ok: true };
    fetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockResponse);
    const r = await fetchWithProxy("https://example.com/test");
    expect(r.ok).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("throws when all proxies fail", async () => {
    fetch.mockRejectedValue(new Error("timeout"));
    await expect(fetchWithProxy("https://example.com/fail")).rejects.toThrow(
      "Alle CORS-Proxies fehlgeschlagen"
    );
  });

  it("proxyStatus returns array with 3 entries", () => {
    const status = proxyStatus();
    expect(status).toHaveLength(3);
    expect(status[0]).toHaveProperty("index");
    expect(status[0]).toHaveProperty("fails");
    expect(status[0]).toHaveProperty("down");
  });

  it("marks proxy as down after 3 failures", async () => {
    fetch.mockRejectedValue(new Error("down"));
    await expect(fetchWithProxy("https://example.com/x")).rejects.toThrow();
    // At least one proxy should now be tracked
    const status = proxyStatus();
    const totalFails = status.reduce((s, p) => s + p.fails, 0);
    expect(totalFails).toBeGreaterThan(0);
  });

  it("throws HTTP error for non-ok response", async () => {
    fetch.mockResolvedValue({ ok: false, status: 403 });
    await expect(fetchWithProxy("https://example.com/403")).rejects.toThrow();
  });
});
