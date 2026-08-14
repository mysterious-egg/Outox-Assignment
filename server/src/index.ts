import express from "express";
import cors from "cors";
import multer from "multer";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";

import { emailQueue } from "./queue/email.queue.js";
import { prisma } from "./lib/prisma.js";
import { parseRecipients } from "./utils/recipients.js";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 3000;
const CLIENT_URL =
  process.env.CLIENT_URL || "http://localhost:5173";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1 * 1024 * 1024,
  },
});

/* -------------------------------------------------------------------------- */
/*                                  MIDDLEWARE                                */
/* -------------------------------------------------------------------------- */

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "reachinbox-development-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    },
  }),
);

app.use(passport.initialize());
app.use(passport.session());

/* -------------------------------------------------------------------------- */
/*                               GOOGLE OAUTH                                 */
/* -------------------------------------------------------------------------- */

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});
passport.deserializeUser(
  async (
    id: string,
    done,
  ) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id,
        },
      });

      if (!user) {
        return done(null, false);
      }

      done(null, user);
    } catch (error) {
      done(error);
    }
  },
);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET || "",
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        "http://localhost:3000/auth/google/callback",
    },

    async (
      _accessToken,
      _refreshToken,
      profile,
      done,
    ) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(
            new Error(
              "Google account does not have an email address",
            ),
          );
        }

        const existingUser =
          await prisma.user.findUnique({
            where: {
              email,
            },
          });

        if (existingUser) {
          return done(null, existingUser);
        }

        const user = await prisma.user.create({
          data: {
            email,
            name:
              profile.displayName ||
              "ReachInbox User",
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

/* -------------------------------------------------------------------------- */
/*                               AUTH ROUTES                                  */
/* -------------------------------------------------------------------------- */

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${CLIENT_URL}/login`,
  }),
  (_req, res) => {
    res.redirect(`${CLIENT_URL}/scheduled`);
  },
);

app.get("/auth/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  const user = req.user as {
    id: string;
    name: string | null;
    email: string;
  };

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
});

app.post("/auth/logout", (req, res) => {
  req.logout((error) => {
    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to logout",
      });
    }

    req.session.destroy(() => {
      res.clearCookie("connect.sid");

      return res.json({
        success: true,
        message: "Logged out successfully",
      });
    });
  });
});

/* -------------------------------------------------------------------------- */
/*                              AUTH MIDDLEWARE                               */
/* -------------------------------------------------------------------------- */

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
}

/* -------------------------------------------------------------------------- */
/*                                  HEALTH                                   */
/* -------------------------------------------------------------------------- */

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "ReachInbox Scheduler backend is running",
  });
});

/* -------------------------------------------------------------------------- */
/*                             PARSE RECIPIENT FILE                           */
/* -------------------------------------------------------------------------- */

app.post(
  "/emails/parse",
  requireAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "A CSV or TXT file is required",
        });
      }

      const fileName =
        req.file.originalname.toLowerCase();

      if (
        !fileName.endsWith(".csv") &&
        !fileName.endsWith(".txt")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only .csv and .txt files are supported",
        });
      }

      const fileContents =
        req.file.buffer.toString("utf-8");

      const recipients =
        parseRecipients(fileContents);

      if (recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "No valid email addresses were found",
        });
      }

      return res.status(200).json({
        success: true,
        count: recipients.length,
        recipients,
      });
    } catch (error) {
      console.error(
        "Failed to parse recipient file:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to parse recipient file",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/*                               TEST JOB ROUTE                               */
/* -------------------------------------------------------------------------- */

app.post("/jobs", async (_req, res) => {
  const job = await emailQueue.add(
    "demo-email",
    {
      recipient: "test@example.com",
      subject: "BullMQ test job",
      body: "This is a BullMQ demonstration job.",
    },
    {
      delay: 5000,
    },
  );

  res.json({
    success: true,
    message: "Job added to queue",
    jobId: job.id,
  });
});

/* -------------------------------------------------------------------------- */
/*                              SCHEDULE EMAILS                               */
/* -------------------------------------------------------------------------- */

app.post(
  "/emails/schedule",
  requireAuth,
  async (req, res) => {
    try {
      const {
        recipients,
        subject,
        body,
        startTime,
        delayBetweenEmails,
      } = req.body;

      const user = req.user as {
        id: string;
        email: string;
        name: string | null;
      };

      if (
        !recipients ||
        !Array.isArray(recipients) ||
        !subject ||
        !body ||
        !startTime ||
        delayBetweenEmails === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "recipients, subject, body, startTime, and delayBetweenEmails are required",
        });
      }

      if (recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "At least one recipient is required",
        });
      }

      if (
        typeof delayBetweenEmails !==
          "number" ||
        delayBetweenEmails < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "delayBetweenEmails must be a non-negative number",
        });
      }

      const startDate = new Date(startTime);

      if (
        Number.isNaN(startDate.getTime())
      ) {
        return res.status(400).json({
          success: false,
          message:
            "startTime must be a valid date",
        });
      }

      if (
        startDate.getTime() < Date.now()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "startTime must be in the future",
        });
      }

      const parsedRecipients =
        parseRecipients(
          recipients.join("\n"),
        );

      if (
        parsedRecipients.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No valid recipients were provided",
        });
      }

      const createdEmails = [];

      for (
        let index = 0;
        index < parsedRecipients.length;
        index++
      ) {
        const recipient =
          parsedRecipients[index];

        const scheduledDate = new Date(
          startDate.getTime() +
            index *
              delayBetweenEmails *
              1000,
        );

        const jobDelay =
          scheduledDate.getTime() -
          Date.now();

        if (jobDelay < 0) {
          return res.status(400).json({
            success: false,
            message:
              "A calculated email time is in the past",
          });
        }

        const email =
          await prisma.email.create({
            data: {
              recipient,
              subject,
              body,
              sender: user.email,
              scheduledAt: scheduledDate,
              status: "SCHEDULED",

              // IMPORTANT:
              // This ties the email to
              // the currently logged-in
              // Google user.
              userId: user.id,
            },
          });

        const job = await emailQueue.add(
          "send-email",
          {
            emailId: email.id,
          },
          {
            delay: jobDelay,
          },
        );

        const updatedEmail =
          await prisma.email.update({
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
    } catch (error) {
      console.error(
        "Failed to schedule emails:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to schedule emails",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/*                            GET SCHEDULED EMAILS                            */
/* -------------------------------------------------------------------------- */

app.get(
  "/emails/scheduled",
  requireAuth,
  async (req, res) => {
    try {
      const user = req.user as {
        id: string;
      };

      const emails =
        await prisma.email.findMany({
          where: {
            status: "SCHEDULED",

            // Only emails belonging
            // to the logged-in user.
            userId: user.id,
          },
          orderBy: {
            scheduledAt: "asc",
          },
          select: {
            id: true,
            recipient: true,
            subject: true,
            scheduledAt: true,
            status: true,
          },
        });

      return res.json({
        success: true,
        emails,
      });
    } catch (error) {
      console.error(
        "Failed to fetch scheduled emails:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch scheduled emails",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/*                              GET SENT EMAILS                               */
/* -------------------------------------------------------------------------- */

app.get(
  "/emails/sent",
  requireAuth,
  async (req, res) => {
    try {
      const user = req.user as {
        id: string;
      };

      const emails =
        await prisma.email.findMany({
          where: {
            // Only emails belonging
            // to the logged-in user.
            userId: user.id,

            status: {
              in: ["SENT", "FAILED"],
            },
          },
          orderBy: {
            sentAt: "desc",
          },
          select: {
            id: true,
            recipient: true,
            subject: true,
            sentAt: true,
            status: true,
          },
        });

      return res.json({
        success: true,
        emails,
      });
    } catch (error) {
      console.error(
        "Failed to fetch sent emails:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch sent emails",
      });
    }
  },
);

/* -------------------------------------------------------------------------- */
/*                            GET SINGLE EMAIL                                */
/* -------------------------------------------------------------------------- */

app.get(
  "/emails/:id",
  requireAuth,
  async (req, res) => {
    try {
      const id = String(req.params.id);

      console.log("Requested email ID:", id);

      const email = await prisma.email.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          recipient: true,
          sender: true,
          subject: true,
          body: true,
          scheduledAt: true,
          sentAt: true,
          status: true,
          userId: true,
        },
      });

      console.log("Database result:", email);

      if (!email) {
        return res.status(404).json({
          success: false,
          message: `Email not found for ID: ${id}`,
        });
      }

      return res.status(200).json({
        success: true,
        email,
      });
    } catch (error) {
      console.error(
        "Failed to fetch email:",
        error,
      );

      return res.status(500).json({
        success: false,
        message: "Failed to fetch email",
      });
    }
  },
);
/* -------------------------------------------------------------------------- */
/*                                 START SERVER                               */
/* -------------------------------------------------------------------------- */

app.listen(PORT, () => {
  console.log(
    `Backend running on http://localhost:${PORT}`,
  );
});