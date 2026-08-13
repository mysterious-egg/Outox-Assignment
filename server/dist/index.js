import express from "express";
import { emailQueue } from "./queue/email.queue.js";
import { prisma } from "./lib/prisma.js";
import { parseRecipients } from "./utils/recipients.js";
import multer from "multer";
const app = express();
const PORT = 3000;
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1 * 1024 * 1024,
    },
});
app.use(express.json());
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "ReachInbox Scheduler backend is running",
    });
});
app.post("/emails/parse", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "A CSV or TXT file is required",
            });
        }
        const fileName = req.file.originalname.toLowerCase();
        if (!fileName.endsWith(".csv") &&
            !fileName.endsWith(".txt")) {
            return res.status(400).json({
                success: false,
                message: "Only .csv and .txt files are supported",
            });
        }
        const fileContents = req.file.buffer.toString("utf-8");
        const recipients = parseRecipients(fileContents);
        if (recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid email addresses were found",
            });
        }
        return res.status(200).json({
            success: true,
            count: recipients.length,
            recipients,
        });
    }
    catch (error) {
        console.error("Failed to parse recipient file:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to parse recipient file",
        });
    }
});
app.post("/jobs", async (req, res) => {
    const job = await emailQueue.add("demo-email", {
        recipient: "test@example.com",
        subject: "BullMQ test job",
        body: "This is a BullMQ demonstration job.",
    }, {
        delay: 5000,
    });
    res.json({
        success: true,
        message: "Job added to queue",
        jobId: job.id,
    });
});
app.post("/emails/schedule", async (req, res) => {
    try {
        const { recipients, subject, body, startTime, delayBetweenEmails, } = req.body;
        if (!recipients ||
            !Array.isArray(recipients) ||
            !subject ||
            !body ||
            !startTime ||
            delayBetweenEmails === undefined) {
            return res.status(400).json({
                success: false,
                message: "recipients, subject, body, startTime, and delayBetweenEmails are required",
            });
        }
        if (recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one recipient is required",
            });
        }
        if (typeof delayBetweenEmails !== "number" ||
            delayBetweenEmails < 0) {
            return res.status(400).json({
                success: false,
                message: "delayBetweenEmails must be a non-negative number",
            });
        }
        const startDate = new Date(startTime);
        if (Number.isNaN(startDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "startTime must be a valid date",
            });
        }
        const parsedRecipients = parseRecipients(recipients.join("\n"));
        if (parsedRecipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid recipients were provided",
            });
        }
        if (startDate.getTime() < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "startTime must be in the future",
            });
        }
        const user = await prisma.user.findUnique({
            where: {
                email: "test@outbox.local",
            },
        });
        if (!user) {
            return res.status(500).json({
                success: false,
                message: "Test user not found",
            });
        }
        const createdEmails = [];
        for (let index = 0; index < parsedRecipients.length; index++) {
            const recipient = parsedRecipients[index];
            const scheduledDate = new Date(startDate.getTime() +
                index * delayBetweenEmails * 1000);
            const jobDelay = scheduledDate.getTime() - Date.now();
            if (jobDelay < 0) {
                return res.status(400).json({
                    success: false,
                    message: "A calculated email time is in the past",
                });
            }
            const email = await prisma.email.create({
                data: {
                    recipient,
                    subject,
                    body,
                    sender: "no-reply@outbox.local",
                    scheduledAt: scheduledDate,
                    status: "SCHEDULED",
                    userId: user.id,
                },
            });
            const job = await emailQueue.add("send-email", {
                emailId: email.id,
            }, {
                delay: jobDelay,
            });
            const updatedEmail = await prisma.email.update({
                where: {
                    id: email.id,
                },
                data: {
                    bullmqJobId: job.id,
                },
            });
            createdEmails.push(updatedEmail);
        }
        return res.status(201).json({
            success: true,
            count: createdEmails.length,
            emails: createdEmails,
        });
    }
    catch (error) {
        console.error("Failed to schedule emails:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to schedule emails",
        });
    }
});
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});
