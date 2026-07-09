/**
 * A tiny token-bucket rate limiter, one bucket per socket. Refills continuously
 * so normal (even fast) typing is never throttled, but a message flood is.
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly capacity: number,
    private readonly refillPerSec: number,
    now: number = Date.now(),
  ) {
    this.tokens = capacity;
    this.lastRefill = now;
  }

  /** Returns true if a token was available (message allowed), false if throttled. */
  tryRemove(now: number = Date.now()): boolean {
    const elapsedSec = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsedSec * this.refillPerSec,
    );
    this.lastRefill = now;
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }
    return false;
  }
}

// Generous for legit editing (bursts up to 200 msgs, sustained 100/sec),
// but caps a malicious flood.
const CAPACITY = 200;
const REFILL_PER_SEC = 100;

const buckets = new Map<string, TokenBucket>();

/** Rate-limit a message from a given socket. */
export function allowMessage(socketId: string): boolean {
  let bucket = buckets.get(socketId);
  if (!bucket) {
    bucket = new TokenBucket(CAPACITY, REFILL_PER_SEC);
    buckets.set(socketId, bucket);
  }
  return bucket.tryRemove();
}

/** Drop a socket's bucket when it disconnects (prevents unbounded growth). */
export function releaseSocket(socketId: string): void {
  buckets.delete(socketId);
}
