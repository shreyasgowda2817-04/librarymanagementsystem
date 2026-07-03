import cron from "node-cron";
import { scanOverdueBooks, scanDueTomorrowBooks } from "./utils/cronJobs.js";

export const initScheduler = () => {
  console.log("⏰ Initializing automated background jobs...");

  // Run overdue scan every day at 08:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("🕒 [CRON] Starting daily overdue books scan...");
    try {
      await scanOverdueBooks();
    } catch (error) {
      console.error("❌ [CRON] Failed to run overdue books scan:", error);
    }
  });

  // Run pre-due reminder scan every day at 09:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("🕒 [CRON] Starting daily pre-due reminders scan...");
    try {
      await scanDueTomorrowBooks();
    } catch (error) {
      console.error("❌ [CRON] Failed to run pre-due reminders scan:", error);
    }
  });
};
