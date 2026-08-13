import "dotenv/config";
import { Queue } from "bullmq";
import { prisma } from "./lib/prisma.js";
const emailQueue = new Queue("email-queue", {
    connection: {
        host: "localhost",
        port: 6379,
    },
});
async function main() {
    const email = await prisma.email.findFirst({
        where: {
            status: "SENT",
        },
        orderBy: {
            sentAt: "desc",
        },
    });
    if (!email) {
        throw new Error("No SENT email found for idempotency test.");
    }
    console.log("Using already-sent email:");
    console.log(email.id);
    console.log(`Current status: ${email.status}`);
    const job = await emailQueue.add("send-email", {
        emailId: email.id,
    });
    console.log(`Created duplicate job: ${job.id}`);
    await emailQueue.close();
    await prisma.$disconnect();
}
main().catch((error) => {
    console.error("Idempotency test failed:", error);
    process.exit(1);
});
