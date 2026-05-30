import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Automatic off-platform backup to Cloudflare R2, daily at 03:00 UTC
// (04:00 Algeria time) — a quiet hour for the shop.
crons.daily(
  "daily-r2-backup",
  { hourUTC: 3, minuteUTC: 0 },
  internal.backupActions.perform,
  { trigger: "cron" }
);

export default crons;
