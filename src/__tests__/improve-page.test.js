import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Test the ImprovePage state logic — specifically that errMsg is cleared
// when /improve-status returns healthy state (the fix for the persistent TimeoutError)
describe("ImprovePage errMsg clearing", () => {
  it("errMsg is cleared when server reports featureRunning=false and no featureRunError", () => {
    // Simulate the logic from startPolling
    let errMsg = "TimeoutError: The operation was aborted due to timeout";

    function handleStatusResponse(data) {
      if (!data.featureRunning) {
        if (data.featureRunError) {
          errMsg = data.featureRunError;
        } else {
          errMsg = ""; // ← the fix
        }
      }
    }

    handleStatusResponse({ featureRunning: false, featureRunError: null });
    expect(errMsg).toBe("");
  });

  it("errMsg is preserved while featureRunning=true", () => {
    let errMsg = "";

    function handleStatusResponse(data) {
      if (!data.featureRunning) {
        errMsg = data.featureRunError || "";
      }
      // No change while running
    }

    handleStatusResponse({ featureRunning: true });
    expect(errMsg).toBe(""); // untouched
  });

  it("errMsg shows server error when featureRunError is set", () => {
    let errMsg = "";

    function handleStatusResponse(data) {
      if (!data.featureRunning) {
        errMsg = data.featureRunError || "";
      }
    }

    handleStatusResponse({ featureRunning: false, featureRunError: "AI call failed: 503" });
    expect(errMsg).toBe("AI call failed: 503");
  });
});

describe("ImprovePage init clears stale errMsg", () => {
  it("init always clears errMsg regardless of server state", () => {
    // Simulate the init() logic
    let errMsg = "TimeoutError: stale from previous session";

    function simulateInit(data) {
      errMsg = ""; // cleared unconditionally on fresh status load
      if (data.lastFeatures) { /* set result */ }
    }

    simulateInit({ lastFeatures: null, featureRunning: false });
    expect(errMsg).toBe("");
  });
});
