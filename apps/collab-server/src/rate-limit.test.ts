import { describe, expect, it } from "vitest";
import { TokenBucket } from "./rate-limit";

describe("TokenBucket", () => {
  it("allows up to capacity, then throttles", () => {
    const bucket = new TokenBucket(3, 1, 0);
    expect(bucket.tryRemove(0)).toBe(true);
    expect(bucket.tryRemove(0)).toBe(true);
    expect(bucket.tryRemove(0)).toBe(true);
    expect(bucket.tryRemove(0)).toBe(false); // exhausted
  });

  it("refills over time", () => {
    const bucket = new TokenBucket(2, 1, 0); // 1 token/sec
    bucket.tryRemove(0);
    bucket.tryRemove(0);
    expect(bucket.tryRemove(0)).toBe(false);
    expect(bucket.tryRemove(1000)).toBe(true); // 1s later → 1 token back
    expect(bucket.tryRemove(1000)).toBe(false);
  });

  it("never refills beyond capacity", () => {
    const bucket = new TokenBucket(2, 100, 0);
    // Long idle shouldn't bank more than `capacity` tokens.
    expect(bucket.tryRemove(1_000_000)).toBe(true);
    expect(bucket.tryRemove(1_000_000)).toBe(true);
    expect(bucket.tryRemove(1_000_000)).toBe(false);
  });
});
