# Outbox

A full-stack email automation and scheduling platform built with React, Vite, Express, Prisma, Redis, and BullMQ. The application lets users log in with Google, upload recipient lists, schedule bulk email sends, and track scheduled or sent email activity.

---

## Overview

Outbox is a modern email workflow application for sending campaigns or scheduled emails in a controlled, rate-limited way. It combines:

- a React frontend for composing and managing email jobs
- an Express + TypeScript backend for authentication, scheduling, and API endpoints
- PostgreSQL as the primary data store via Prisma ORM
- Redis + BullMQ for async job processing
- SMTP email delivery via Nodemailer
- Google OAuth login for user authentication

This project is designed for local development and includes Docker support for PostgreSQL and Redis.

---

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- ESLint

### Backend
- Node.js
- Express 5
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- BullMQ
- Nodemailer
- Passport + Google OAuth

### Infrastructure
- Docker Compose
- PostgreSQL container
- Redis container

---

## Project Structure

```text
Outbox/
├── docker-compose.yml              # PostgreSQL + Redis services
├── readme.md                       # Project documentation
├── frontend/                       # React frontend app
│   ├── .env.example                # Frontend env template
│   ├── package.json                # Frontend dependencies/scripts
│   ├── vite.config.ts             # Vite config
│   ├── index.html                 # App entry
│   ├── public/                    # Static assets
│   └── src/
│       ├── App.tsx                # Main route setup
│       ├── main.tsx               # App bootstrap
│       ├── App.css                # App styling
│       ├── index.css              # Global CSS
│       ├── components/            # Reusable UI components
│       ├── context/               # Auth context
│       ├── pages/                 # Login, compose, scheduled, sent pages
│       └── services/
│           └── api.ts             # API client layer
├── server/                         # Express + Prisma backend
│   ├── .env.example               # Backend env template
│   ├── package.json               # Server dependencies/scripts
│   ├── tsconfig.json              # TypeScript config
│   ├── prisma/
│   │   ├── schema.prisma          # Prisma schema
│   │   └── migrations/           # Prisma migration files
│   ├── src/
│   │   ├── index.ts               # API server entry point
│   │   ├── worker.ts              # Redis/BullMQ email worker
│   │   ├── lib/
│   │   │   ├── prisma.ts          # Prisma client setup
│   │   │   ├── redis.ts           # Redis connection
│   │   │   └── mailer.ts          # SMTP transport config
│   │   ├── queue/
│   │   │   └── email.queue.ts    # BullMQ queue setup
│   │   ├── services/
│   │   │   └── email-rate-limit.ts
│   │   ├── utils/
│   │   │   └── recipients.ts      # CSV/TXT recipient parsing
│   │   ├── db-test.ts             # Database smoke test
│   │   ├── email-test.ts          # Mailer smoke test
│   │   ├── recipients-test.ts     # Recipient parser checks
│   │   ├── queue-test.ts          # Queue test
│   │   ├── idempotency-test.ts    # Email send idempotency checks
│   │   └── rate-limit-test.ts     # Rate limiting tests
│   └── prisma.config.ts           # Prisma config
└── .gitignore
```

---

## Prerequisites

Before getting started, make sure you have:

- Node.js 18+ recommended
- npm
- Docker Desktop or Docker Engine
- A Google Cloud project for OAuth (optional but required for login)
- An SMTP provider or Ethereal test account for testing email sending

---

## Environment Setup

### 1. Start the infrastructure services

From the project root:

```bash
docker-compose up -d
```

This starts:

- PostgreSQL on port 5433
- Redis on port 6379

---

### 2. Backend setup

Go to the server folder:

```bash
cd server
npm install
```

Create a backend environment file:

```bash
copy .env.example .env
```

Then update the values in `.env` to match your local setup. A typical example is:

```env
PORT=3000
CLIENT_URL=http://localhost:5173
SESSION_SECRET=your-super-secret-session-key
DATABASE_URL=postgresql://outbox:outbox_password@localhost:5433/reachinbox?schema=public

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your-ethereal-user
ETHEREAL_PASSWORD=your-ethereal-password

WORKER_CONCURRENCY=3
MAX_EMAILS_PER_HOUR=100
```

Initialize Prisma and sync the database schema:

```bash
npx prisma generate
npx prisma db push
```

Start the API server:

```bash
npm run dev
```

In a second terminal, start the queue worker:

```bash
npm run worker
```

The backend API will run at:

```text
http://localhost:3000
```

---

### 3. Frontend setup

Open a new terminal and go to the frontend app:

```bash
cd frontend
npm install
```

Create the frontend environment file:

```bash
copy .env.example .env
```

Update it if needed:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Start the React app:

```bash
npm run dev
```

The frontend should run at:

```text
http://localhost:5173
```

---

## Google OAuth Setup

To enable login with Google:

1. Create a project in Google Cloud Console
2. Enable Google OAuth 2.0
3. Configure the OAuth consent screen
4. Create OAuth credentials
5. Add your redirect URI:

```text
http://localhost:3000/auth/google/callback
```

6. Add the generated `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to the backend `.env` file

---

## Email Sending Workflow

The application supports a scheduling flow like this:

1. User logs in via Google
2. User uploads a CSV/TXT recipient file or enters recipients manually
3. User creates an email with subject and body
4. The backend validates recipients and schedules email jobs
5. Jobs are queued in BullMQ and stored in Redis
6. The worker processes each email at the scheduled time
7. The email is sent through the configured SMTP transport
8. The email status is updated in PostgreSQL

---

## Rate Limiting

The backend includes a rate-limit service to avoid exceeding the configured hourly email threshold. The worker checks availability before sending each queued email and delays jobs if the limit is reached.

The default configuration is controlled by:

```env
MAX_EMAILS_PER_HOUR=100
```

---

## Useful Commands

### Server
```bash
cd server
npm install
npm run dev
npm run build
npm run worker
npx prisma generate
npx prisma db push
```

### Frontend
```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
```

### Docker
```bash
docker-compose up -d
docker-compose down
```

---

## Notes

- PostgreSQL is configured in Docker on port 5433 to avoid conflicts with local PostgreSQL setups.
- Redis is required for BullMQ background jobs.
- If email sending is being tested without a real SMTP provider, use an Ethereal SMTP test account.
- If the app returns login issues, confirm that `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the callback URL are correct.

---

## License

This project is for assignment/demo purposes and is intended for local development and testing.

---

## Quick Start Summary

```bash
# from project root
cd server
npm install
copy .env.example .env
npx prisma generate
npx prisma db push
npm run dev

# in a second terminal
cd server
npm run worker

# in a third terminal
cd frontend
npm install
copy .env.example .env
npm run dev
```

Then open:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
