// server/src/routes/acquisitionsRoutes.js
import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  getBudget, updateBudget,
  getVendors, createVendor, updateVendor, deleteVendor,
  getPurchaseOrders, createPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder,
  approvePurchaseOrder, receivePurchaseOrderItems,
  getInvoices, createInvoice, updateInvoiceStatus
} from "../controllers/acquisitionsController.js";

const router = express.Router();

// Budget
router.get("/budget", protect, getBudget);
router.put("/budget", protect, updateBudget);

// Vendors
router.get("/vendors", protect, getVendors);
router.post("/vendors", protect, admin, createVendor);
router.put("/vendors/:id", protect, admin, updateVendor);
router.delete("/vendors/:id", protect, admin, deleteVendor);

// Purchase Orders
router.get("/orders", protect, getPurchaseOrders);
router.post("/orders", protect, admin, createPurchaseOrder);
router.put("/orders/:id/status", protect, admin, updatePurchaseOrderStatus);
router.put("/orders/:id/approve", protect, admin, approvePurchaseOrder);
router.put("/orders/:id/receive", protect, admin, receivePurchaseOrderItems);
router.delete("/orders/:id", protect, admin, deletePurchaseOrder);

// Invoices
router.get("/invoices", protect, admin, getInvoices);
router.post("/invoices", protect, admin, createInvoice);
router.put("/invoices/:id/status", protect, admin, updateInvoiceStatus);

export default router;
