const maxTokens = parseInt(process.env.TMDB_RATE_LIMIT ?? "40", 10);

let tokens = maxTokens;
let lastRefill = Date.now();

function refill() {
  const now = Date.now();
  const elapsed = now - lastRefill;
  const toAdd = (elapsed / 60_000) * maxTokens;
  tokens = Math.min(maxTokens, tokens + toAdd);
  lastRefill = now;
}

export function tryAcquire(): boolean {
  refill();
  if (tokens >= 1) {
    tokens -= 1;
    return true;
  }
  return false;
}

export function msUntilAvailable(): number {
  refill();
  if (tokens >= 1) return 0;
  const deficit = 1 - tokens;
  return Math.ceil((deficit / maxTokens) * 60_000);
}
