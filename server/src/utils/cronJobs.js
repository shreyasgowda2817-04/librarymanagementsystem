import cron from "node-cron";
import mongoose from "mongoose";
import os from "os";
import Transaction from "../models/transaction.js";
import Notification from "../models/notification.js";
import User from "../models/user.js";
import BookRequest from "../models/BookRequest.js";
import sendEmail, { sendSMS, emailTemplates } from "../services/emailService.js";
import { initProcurementCron } from "./procurementCron.js";

// Enterprise Job Configuration State
export const jobConfigs = {
  overdue: {
    name: "Overdue & Fine Automation",
    description: "Daily scan for late assets and automatic fine calculation.",
    enabled: true,
    schedule: "1 0 * * *",
    lastRun: null
  },
  requests: {
    name: "Procurement Cleanup",
    description: "Closing stale book requests older than 7 days.",
    enabled: true,
    schedule: "0 1 * * *",
    lastRun: null
  },
  health: {
    name: "System Diagnostic",
    description: "Automated hardware and integrity diagnostics every 4 hours.",
    enabled: true,
    schedule: "0 */4 * * *",
    lastRun: null
  },
  dueTomorrow: {
    name: "Pre-Due Reminders",
    description: "Daily scan for assets due tomorrow to dispatch reminders.",
    enabled: true,
    schedule: "0 9 * * *",
    lastRun: null
  },
  membershipExpiry: {
    name: "Membership Expiration Scan",
    description: "Scans for subscriptions older than 30 days and downgrades them back to Basic.",
    enabled: true,
    schedule: "0 2 * * *",
    lastRun: null
  }
};

// 1. Overdue Books & Fines Automation Logic
export const scanOverdueBooks = async () => {
    console.log("🤖 [CRON-AUTO] Running overdue scan...");
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const activeTransactions = await Transaction.find({ returned: false })
        .populate("memberId")
        .populate("bookId");
        
      let overdueCount = 0;

      for (const tx of activeTransactions) {
        const member = tx.memberId;
        if (member && member.email) {
          const userObj = await User.findOne({ email: member.email });
          if (userObj && userObj.membership === "Elite") {
            if (tx.penalty !== 0) {
              tx.penalty = 0;
              await tx.save();
            }
            continue;
          }
        }

        const due = new Date(tx.dueDate);
        due.setUTCHours(0, 0, 0, 0);
        
        if (today > due) {
          overdueCount++;
          const diffTime = Math.abs(today - due);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const DAILY_FINE = 10;
          const calculatedPenalty = diffDays * DAILY_FINE;
          
          if (tx.penalty !== calculatedPenalty) {
            tx.penalty = calculatedPenalty;
            await tx.save();

            // Dispatch Email and SMS Reminders to Member
            const user = tx.memberId;
            const bookTitle = tx.bookId?.title || "Unknown Book";
            
            if (user && user.email) {
              const html = emailTemplates.overdueNotice(user.name || "Member", bookTitle, diffDays, calculatedPenalty);
              await sendEmail(user.email, "⚠️ Action Required: Overdue Book Notice", html);
            }
            if (user && user.phone) {
              await sendSMS(user.phone, `Hi ${user.name || "Member"}, your borrowed book "${bookTitle}" is overdue by ${diffDays} days. Current fine: ₹${calculatedPenalty}. Please return it ASAP.`);
            }
          }
        }
      }

      if (overdueCount > 0) {
        const admins = await User.find({ role: "admin" });
        const notificationPromises = admins.map(admin => 
          Notification.create({
            userId: admin._id,
            title: "Overdue Alert (Manual)",
            message: `System scan detected ${overdueCount} overdue book(s).`,
            type: "overdue"
          })
        );
        await Promise.all(notificationPromises);
      }
      jobConfigs.overdue.lastRun = new Date();
      console.log(`🤖 [CRON-AUTO] Scan complete: ${overdueCount} books.`);
    } catch (error) {
      console.error("❌ Error during scan:", error);
    }
};

// 1.5 Due Tomorrow Automation Logic
export const scanDueTomorrowBooks = async () => {
    console.log("🤖 [CRON-AUTO] Running due-tomorrow scan...");
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const activeTransactions = await Transaction.find({ returned: false })
        .populate("memberId")
        .populate("bookId");
        
      let reminderCount = 0;

      for (const tx of activeTransactions) {
        const due = new Date(tx.dueDate);
        due.setUTCHours(0, 0, 0, 0);
        
        if (due.getTime() === tomorrow.getTime()) {
          reminderCount++;
          
          const user = tx.memberId;
          const bookTitle = tx.bookId?.title || "Unknown Book";
          
          if (user && user.email) {
            const html = emailTemplates.dueTomorrowReminder(user.name || "Member", bookTitle);
            await sendEmail(user.email, "⏳ Reminder: Book Due Tomorrow", html);
          }
          if (user && user.phone) {
            await sendSMS(user.phone, `Hi ${user.name || "Member"}, friendly reminder that your borrowed book "${bookTitle}" is due tomorrow!`);
          }
        }
      }

      jobConfigs.dueTomorrow.lastRun = new Date();
      console.log(`🤖 [CRON-AUTO] Pre-due scan complete: ${reminderCount} reminders sent.`);
    } catch (error) {
      console.error("❌ Error during pre-due scan:", error);
    }
};

// 2. Abandoned Book Requests Cleanup Logic
export const cleanupAbandonedRequests = async () => {
    console.log("🤖 [CRON-AUTO] Cleaning requests...");
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() - 7);

      const abandonedRequests = await BookRequest.find({
        status: "Pending",
        createdAt: { $lt: expirationDate }
      });

      let removedCount = 0;
      for (const req of abandonedRequests) {
        req.status = "Rejected";
        req.adminNote = "Automatically closed by system.";
        await req.save();
        removedCount++;
        
        await Notification.create({
            userId: req.userId,
            title: "Book Request Expired",
            message: `Your request for "${req.title}" has expired.`,
            type: "warning"
        });
      }
      jobConfigs.requests.lastRun = new Date();
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
    }
};

// 3. System Health Automation Logic
export const systemHealthCheck = async () => {
    try {
        const dbState = mongoose.connection.readyState === 1 ? "Connected & Healthy" : "Degraded";
        const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(2);
        const freeMem = (os.freemem() / (1024 ** 3)).toFixed(2);
        const uptime = (os.uptime() / 3600).toFixed(1);

        const admins = await User.find({ role: "admin" });
        const notificationPromises = admins.map(admin => 
          Notification.create({
            userId: admin._id,
            title: "System Diagnostic Report",
            message: `DB Status: ${dbState}. Memory: ${freeMem}GB / ${totalMem}GB free. Uptime: ${uptime} hrs.`,
            type: "success"
          })
        );
        await Promise.all(notificationPromises);
        jobConfigs.health.lastRun = new Date();
    } catch (err) {
      console.error("❌ Health check failure:", err);
    }
};

// 4. Membership Expiry Logic
export const scanExpiredMemberships = async () => {
  console.log("🤖 [CRON-AUTO] Running membership expiration scan...");
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeSubscribers = await User.find({ membership: { $in: ["Premium", "Elite"] } });
    let expiredCount = 0;

    for (const user of activeSubscribers) {
      const payments = user.paymentHistory || [];
      const subPayments = payments.filter(p => p.amount > 0 && (p.planName?.includes("Premium") || p.planName?.includes("Elite") || p.planName?.includes("Membership")));
      
      if (subPayments.length > 0) {
        subPayments.sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestPayment = subPayments[0];
        const paymentDate = new Date(latestPayment.date);

        if (paymentDate < thirtyDaysAgo) {
          user.membership = "Basic";
          
          user.paymentHistory.push({
            orderId: `expired_${Date.now()}`,
            paymentId: "EXPIRED_AUTO",
            amount: 0,
            planName: "Membership Expired (Reverted to Basic)",
            date: new Date()
          });
          
          await user.save();
          expiredCount++;

          await Notification.create({
            userId: user._id,
            title: "Subscription Expired",
            message: `Your ${latestPayment.planName || "Premium"} membership has expired after 30 days. You have been reverted to Basic.`,
            type: "warning"
          });

          if (user.email) {
            const html = `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Subscription Expired</h2>
                <p>Hi ${user.name || "Member"},</p>
                <p>Your subscription to the <strong>${latestPayment.planName || "LMS Premium"}</strong> has expired as it is past the 30-day billing cycle.</p>
                <p>Your account has been automatically reverted to the free <strong>Basic Plan</strong>. Any active loans exceeding your basic quota should be returned soon.</p>
                <p>To restore digital access and extended limits, please renew your subscription in the portal.</p>
                <br/>
                <p>Best regards,<br/>The Libraryly Team</p>
              </div>
            `;
            await sendEmail(user.email, "⚠️ Your Subscription Has Expired", html).catch(err => console.error("Email send failed:", err));
          }
        }
      } else {
        const creationDate = new Date(user.createdAt || Date.now());
        if (creationDate < thirtyDaysAgo) {
          user.membership = "Basic";
          await user.save();
          expiredCount++;
          
          await Notification.create({
            userId: user._id,
            title: "Subscription Expired",
            message: "Your premium status has expired. Reverted to Basic.",
            type: "warning"
          });
        }
      }
    }

    if (expiredCount > 0) {
      const admins = await User.find({ role: "admin" });
      const notificationPromises = admins.map(admin => 
        Notification.create({
          userId: admin._id,
          title: "Membership Cleanup Report",
          message: `Membership scanner automatically expired ${expiredCount} account subscriptions.`,
          type: "warning"
        })
      );
      await Promise.all(notificationPromises);
    }
    
    jobConfigs.membershipExpiry.lastRun = new Date();
    console.log(`🤖 [CRON-AUTO] Membership scan complete: expired ${expiredCount} subscriptions.`);
  } catch (error) {
    console.error("❌ Error during membership scan:", error);
  }
};

export const startCronJobs = () => {
  // Overdue Task
  cron.schedule(jobConfigs.overdue.schedule, async () => {
    if (jobConfigs.overdue.enabled) await scanOverdueBooks();
  });

  // Pre-Due Task
  cron.schedule(jobConfigs.dueTomorrow.schedule, async () => {
    if (jobConfigs.dueTomorrow.enabled) await scanDueTomorrowBooks();
  });

  // Requests Task
  cron.schedule(jobConfigs.requests.schedule, async () => {
    if (jobConfigs.requests.enabled) await cleanupAbandonedRequests();
  });

  // Health Check Task
  cron.schedule(jobConfigs.health.schedule, async () => {
    if (jobConfigs.health.enabled) await systemHealthCheck();
  });

  // Membership Expiry Task
  cron.schedule(jobConfigs.membershipExpiry.schedule, async () => {
    if (jobConfigs.membershipExpiry.enabled) await scanExpiredMemberships();
  });

  // Automated Procurement Task
  initProcurementCron();
};
