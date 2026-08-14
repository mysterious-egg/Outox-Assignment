import "dotenv/config";
import { reserveEmailSlot } from "./services/email-rate-limit.js";
import { redis } from "./lib/redis.js";

async function runTest() {
  console.log("Attempting to reserve 5 slots concurrently...\n");

  const results = await Promise.all(
    Array.from({ length: 5 }, async (_, index) => {
      const result = await reserveEmailSlot();

      return {
        attempt: index + 1,
        ...result,
      };
    })
  );

  for (const result of results) {
    console.log(
      `Attempt ${result.attempt} → ${
        result.allowed ? "allowed" : "denied"
      }`
    );
  }

  const allowedCount = results.filter(
    (result) => result.allowed
  ).length;

  const deniedCount = results.filter(
    (result) => !result.allowed
  ).length;

  console.log(`\nAllowed: ${allowedCount}`);
  console.log(`Denied: ${deniedCount}`);

  console.log(
    `Next window begins: ${results[0]?.nextWindowAt.toISOString()}`
  );

  console.log(
    `Retry after: ${results[0]?.retryAfterMs}ms`
  );

  await redis.quit();
}

runTest().catch(async (error) => {
  console.error("Rate-limit test failed:", error);

  await redis.quit();

  process.exit(1);
});