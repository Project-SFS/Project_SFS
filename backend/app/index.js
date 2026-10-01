import dotenv from "dotenv"
dotenv.config()

import app from "./app.js";
import migrate from "../database/migrate.js";
import { close } from "../database/db.js";
import { startScheduledJobs } from "../utils/scheduler.js";
import { waitForPendingMail } from "../utils/mailer.js";

const PORT = process.env.PORT || 9022

for (const name of ["DB_PASSWORD", "JWT_SCERET"]) {
  if (!process.env[name]) {
    console.error(`Missing required environment variable ${name}`);
    process.exit(1);
  }
}

// Retry while the database comes up; exit if it never does so Docker restarts the container
const MIGRATION_ATTEMPTS = 20;
for (let attempt = 1; attempt <= MIGRATION_ATTEMPTS; attempt++) {
  try {
    await migrate();
    break;
  } catch (error) {
    console.error(`Database migration failed (attempt ${attempt}/${MIGRATION_ATTEMPTS}):`, error.message);
    if (attempt === MIGRATION_ATTEMPTS) process.exit(1);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
}

const server = app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});

// graduation check and deadline reminders (now, then every few hours)
startScheduledJobs();

// Let in-flight requests finish when Docker stops the container
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    // let mails that are being prepared or sent finish (docker-compose gives the backend 30 s to stop)
    await waitForPendingMail(20000);
    await close().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 25000).unref();
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
