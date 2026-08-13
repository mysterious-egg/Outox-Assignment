import express from "express";
import { emailQueue } from "./queue/email.queue.js";
import { prisma } from "./lib/prisma.js";

const app = express();

const PORT = 3000;

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "ReachInbox Scheduler backend is running",
  });
});

app.post("/jobs", async (req, res) => {
  const job = await emailQueue.add(
    "demo-email",
    {
      recipient: "test@example.com",
      subject: "BullMQ test job",
      body: "This is a BullMQ demonstration job.",
    },
    {
      delay: 5000,
    }
  );

  res.json({
    success: true,
    message: "Job added to queue",
    jobId: job.id,
  });
});

app.post("/emails/schedule", async (req, res) => {
  try {
    const {
      recipient,
      subject,
      body,
      scheduledAt,
    } = req.body;

    if (!recipient || !subject || !body || !scheduledAt) {
      return res.status(400).json({
        success: false,
        message: "recipient, subject, body, and scheduledAt are required",
      });
    }

    const scheduledDate = new Date(scheduledAt);

    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "scheduledAt must be a valid date",
      });
    }

    const delay = scheduledDate.getTime() - Date.now();

    if (delay < 0) {
      return res.status(400).json({
        success: false,
        message: "scheduledAt must be in the future",
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

    const job = await emailQueue.add(
      "send-email",
      {
        emailId: email.id,
      },
      {
        delay,
      }
    );

    const updatedEmail = await prisma.email.update({
      where: {
        id: email.id,
      },
      data: {
        bullmqJobId: job.id,
      },
    });

    return res.status(201).json({
      success: true,
      email: updatedEmail,
      jobId: job.id,
      delay,
    });
  } catch (error) {
    console.error("Failed to schedule email:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to schedule email",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});