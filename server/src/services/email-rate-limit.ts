import { redis } from "../lib/redis.js";

const RATE_LIMIT_KEY_PREFIX = "email-rate-limit";

export type RateLimitResult = {
  allowed: boolean;
  nextWindowAt: Date;
  retryAfterMs: number;
};

function getCurrentHourWindow(now: Date) {
  const windowStart = new Date(now);

  windowStart.setMinutes(0, 0, 0);

  const nextWindowAt = new Date(windowStart);

  nextWindowAt.setHours(nextWindowAt.getHours() + 1);

  return {
    windowStart,
    nextWindowAt,
  };
}

function getRateLimitKey(windowStart: Date) {
  const year = windowStart.getFullYear();
  const month = String(windowStart.getMonth() + 1).padStart(2, "0");
  const day = String(windowStart.getDate()).padStart(2, "0");
  const hour = String(windowStart.getHours()).padStart(2, "0");

  return `${RATE_LIMIT_KEY_PREFIX}:${year}-${month}-${day}T${hour}`;
}

export async function reserveEmailSlot(): Promise<RateLimitResult> {
  const maxEmailsPerHour = Number(
    process.env.MAX_EMAILS_PER_HOUR ?? "100"
  );

  if (
    !Number.isInteger(maxEmailsPerHour) ||
    maxEmailsPerHour <= 0
  ) {
    throw new Error(
      "MAX_EMAILS_PER_HOUR must be a positive integer"
    );
  }

  const now = new Date();

  const { windowStart, nextWindowAt } =
    getCurrentHourWindow(now);

  const key = getRateLimitKey(windowStart);

  const retryAfterMs = Math.max(
    1,
    nextWindowAt.getTime() - now.getTime()
  );

  const result = await redis.eval(
    `
      local current = redis.call("GET", KEYS[1])

      if current and tonumber(current) >= tonumber(ARGV[1]) then
        return 0
      end

      local newCount = redis.call("INCR", KEYS[1])

      if newCount == 1 then
        redis.call("PEXPIRE", KEYS[1], ARGV[2])
      end

      return 1
    `,
    1,
    key,
    String(maxEmailsPerHour),
    String(retryAfterMs)
  );

  return {
    allowed: result === 1,
    nextWindowAt,
    retryAfterMs,
  };
}