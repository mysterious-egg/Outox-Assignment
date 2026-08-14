import { emailQueue } from "./queue/email.queue.js";

async function test() {
  const jobId = "60";

  const originalJob = await emailQueue.getJob(jobId);

  if (!originalJob) {
    console.error(`Job ${jobId} not found.`);
    process.exit(1);
  }

  console.log(`Original job ID: ${originalJob.id}`);
  console.log(`Original job state: ${await originalJob.getState()}`);

  const duplicateJob = await emailQueue.add(
    "send-email",
    {
      emailId: originalJob.data.emailId,
    }
  );

  console.log(`Duplicate test job created: ${duplicateJob.id}`);
  console.log(`Using email ID: ${originalJob.data.emailId}`);

  await emailQueue.close();
}

test();