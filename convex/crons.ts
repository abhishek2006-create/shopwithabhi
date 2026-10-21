import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
const crons = cronJobs();
crons.daily(
  "expire short-lived records",
  { hourUTC: 2, minuteUTC: 0 },
  internal.maintenance.cleanup,
);
export default crons;
