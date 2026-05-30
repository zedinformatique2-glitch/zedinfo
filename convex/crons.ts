import { cronJobs } from "convex/server";

const crons = cronJobs();

// No scheduled jobs. Backups are triggered manually from the admin panel
// (/admin/backups → "احفظ الآن").

export default crons;
