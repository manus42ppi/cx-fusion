import { describe, it, expect, beforeEach } from "vitest";
import { canAttempt, recordSuccess, recordFailure, getStatus } from "../utils/circuit-breaker.js";

// Reset internal Map between tests by cycling unique keys
let keyCounter = 0;
const key = () => `test-key-${keyCounter++}`;

describe("circuit-breaker", () => {
  it("allows first attempt on unknown key", () => {
    expect(canAttempt(key())).toBe(true);
  });

  it("stays open after maxFails failures", () => {
    const k = key();
    recordFailure(k); recordFailure(k); recordFailure(k);
    expect(canAttempt(k)).toBe(false);
  });

  it("recordFailure returns true when circuit opens", () => {
    const k = key();
    expect(recordFailure(k)).toBe(false); // 1st fail, not open yet
    expect(recordFailure(k)).toBe(false); // 2nd
    expect(recordFailure(k)).toBe(true);  // 3rd → opens
  });

  it("recordSuccess resets a broken circuit", () => {
    const k = key();
    recordFailure(k); recordFailure(k); recordFailure(k);
    expect(canAttempt(k)).toBe(false);
    recordSuccess(k);
    expect(canAttempt(k)).toBe(true);
  });

  it("reopens automatically after cooldown", () => {
    const k = key();
    recordFailure(k); recordFailure(k); recordFailure(k);
    // cooldownMs=-1 means cooldown already expired (Date.now() - lastFail > -1 is always true)
    expect(canAttempt(k, 3, -1)).toBe(true);
  });

  it("getStatus returns all open breakers", () => {
    const k = key();
    recordFailure(k); recordFailure(k); recordFailure(k);
    const s = getStatus();
    expect(s[k]).toBeDefined();
    expect(s[k].open).toBe(true);
  });

  it("custom maxFails respected", () => {
    const k = key();
    // canAttempt checks b.open, which is set by recordFailure(key, maxFails)
    recordFailure(k, 5); recordFailure(k, 5); recordFailure(k, 5); recordFailure(k, 5);
    expect(canAttempt(k)).toBe(true); // 4 fails with maxFails=5 → circuit still closed
    recordFailure(k, 5);
    expect(canAttempt(k)).toBe(false); // 5th fail → circuit opens
  });
});
