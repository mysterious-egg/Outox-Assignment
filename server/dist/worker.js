import "dotenv/config";
import { Worker } from "bullmq";
import { prisma } from "./lib/prisma.js";
import { transporter } from "./lib/mailer.js";
const workerConcurrency = Number(process.env.WORKER_CONCURRENCY ?? "1");
const worker = new Worker("email-queue", async (job) => {
    console.log(`Worker received job ${job.id}`);
    const { emailId } = job.data;
    console.log(`Looking up email ${emailId} in PostgreSQL...`);
    const email = await prisma.email.findUnique({
        where: {
            id: emailId,
        },
    });
    if (!email) {
        throw new Error(`Email ${emailId} not found in database`);
    }
    console.log(`Email status: ${email.status}`);
    // Idempotency protection.
    // If this email was already sent, do not send it again.
    if (email.status === "SENT") {
        console.log(`Email ${email.id} was already sent. Skipping.`);
        return;
    }
    try {
        console.log(`Sending email to ${email.recipient}...`);
        const info = await transporter.sendMail({
            from: email.sender,
            to: email.recipient,
            subject: email.subject,
            text: email.body,
        });
        console.log(`Email sent successfully.`);
        console.log(`Message ID: ${info.messageId}`);
        await prisma.email.update({
            where: {
                id: email.id,
            },
            data: {
                status: "SENT",
                sentAt: new Date(),
                error: null,
            },
        });
        console.log(`Email ${email.id} marked as SENT in PostgreSQL.`);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to send email ${email.id}:`, errorMessage);
        await prisma.email.update({
            where: {
                id: email.id,
            },
            data: {
                status: "FAILED",
                error: errorMessage,
            },
        });
        console.log(`Email ${email.id} marked as FAILED in PostgreSQL.`);
        // Important:
        // Re-throw the error so BullMQ knows the job failed.
        throw error;
    }
}, {
    connection: {
        host: "localhost",
        port: 6379,
    },
    concurrency: workerConcurrency,
});
worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed.`);
});
worker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error.message);
});
console.log(`Email worker is running with concurrency: ${workerConcurrency}...`);
