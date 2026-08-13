import { emailQueue } from "./queue/email.queue.js";
const counts = await emailQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
console.log("Queue counts:");
console.log(counts);
const delayedJobs = await emailQueue.getDelayed(0, 20);
console.log("\nDelayed jobs:");
for (const job of delayedJobs) {
    console.log({
        id: job.id,
        name: job.name,
        data: job.data,
        delay: job.opts.delay,
    });
}
await emailQueue.close();
