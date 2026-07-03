import express from "express";
import { 
  scanOverdueBooks, 
  scanDueTomorrowBooks, 
  cleanupAbandonedRequests, 
  systemHealthCheck, 
  scanExpiredMemberships 
} from "../utils/cronJobs.js";
import { runProcurementCheck } from "../utils/procurementCron.js";

const router = express.Router();

const requireCronSecret = (req, res, next) => {
  const secret = req.headers["x-cron-secret"] || req.query.secret;
  const expectedSecret = process.env.CRON_SECRET || "default_cron_secret";
  
  if (secret !== expectedSecret) {
    return res.status(403).json({ message: "Forbidden: Invalid Cron Secret" });
  }
  next();
};

router.post("/trigger", requireCronSecret, async (req, res, next) => {
  try {
    const { action } = req.body;
    
    switch (action) {
      case "overdue":
        await scanOverdueBooks();
        break;
      case "pre-due":
        await scanDueTomorrowBooks();
        break;
      case "requests":
        await cleanupAbandonedRequests();
        break;
      case "health":
        await systemHealthCheck();
        break;
      case "membership":
        await scanExpiredMemberships();
        break;
      case "procurement":
        await runProcurementCheck();
        break;
      case "all":
        await scanOverdueBooks();
        await scanDueTomorrowBooks();
        await cleanupAbandonedRequests();
        await systemHealthCheck();
        await scanExpiredMemberships();
        await runProcurementCheck();
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }
    
    res.json({ message: `Cron action '${action}' completed successfully.` });
  } catch (err) {
    next(err);
  }
});

export default router;
