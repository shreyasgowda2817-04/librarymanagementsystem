// server/src/controllers/acquisitionsController.js
import Vendor from "../models/Vendor.js";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Budget from "../models/Budget.js";
import Book from "../models/book.js";
import Invoice from "../models/Invoice.js";

// ─── BUDGET ──────────────────────────────────────────────────────────────────

export const getBudget = async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    let budget = await Budget.findOne({ year });

    if (!budget) {
      // Create a default budget for the current year
      budget = await Budget.create({
        year,
        totalBudget: 120000,
        allocations: [
          { category: "Computer Science", amount: 45000, color: "#4f46e5" },
          { category: "Engineering",      amount: 30000, color: "#0ea5e9" },
          { category: "Medical",          amount: 25000, color: "#f43f5e" },
          { category: "Fiction",          amount: 15000, color: "#8b5cf6" },
          { category: "Periodicals",      amount: 5000,  color: "#10b981" }
        ]
      });
    }

    // Calculate YTD expenditure and encumbrances
    const startOfYear = new Date(`${year}-01-01`);
    const orders = await PurchaseOrder.find({
      status: { $in: ["approved", "processing", "shipped", "partially_received", "delivered", "invoiced", "closed"] },
      createdAt: { $gte: startOfYear }
    });

    const encumbered = budget.encumbered;
    const expended = budget.expended;
    const remaining = budget.totalBudget - encumbered - expended;

    // Monthly spending breakdown for chart
    const monthly = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end   = new Date(year, m + 1, 0, 23, 59, 59);
      const monthOrders = await PurchaseOrder.find({
        status: { $in: ["approved", "processing", "shipped", "partially_received", "delivered", "invoiced", "closed"] },
        createdAt: { $gte: start, $lte: end }
      });
      monthly.push({
        month: start.toLocaleString("default", { month: "short" }),
        amount: monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      });
    }

    res.json({ budget, encumbered, expended, remaining, monthly });
  } catch (err) { next(err); }
};

export const updateBudget = async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    const { totalBudget, allocations } = req.body;

    console.log(`[Budget] Updating budget for year ${year}: totalBudget=${totalBudget}, categories=${allocations?.length}`);

    // Use findOne + save() — most reliable with Mongoose nested arrays
    let budget = await Budget.findOne({ year });

    if (!budget) {
      budget = new Budget({ year });
    }

    budget.totalBudget = Number(totalBudget);
    budget.allocations = allocations;
    await budget.save();

    console.log(`[Budget] Saved successfully: _id=${budget._id}, totalBudget=${budget.totalBudget}`);

    // Return same shape as getBudget
    const startOfYear = new Date(`${year}-01-01`);
    const encumbered = budget.encumbered;
    const expended = budget.expended;
    const remaining = budget.totalBudget - encumbered - expended;

    const monthly = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end   = new Date(year, m + 1, 0, 23, 59, 59);
      const monthOrders = await PurchaseOrder.find({
        status: { $in: ["approved", "processing", "shipped", "partially_received", "delivered", "invoiced", "closed"] },
        createdAt: { $gte: start, $lte: end }
      });
      monthly.push({
        month: start.toLocaleString("default", { month: "short" }),
        amount: monthOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
      });
    }

    res.json({ budget, encumbered, expended, remaining, monthly });
  } catch (err) {
    console.error("[Budget] Update error:", err.message);
    next(err);
  }
};

// ─── VENDORS ─────────────────────────────────────────────────────────────────

export const getVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find({ isActive: true }).sort({ createdAt: -1 });

    // Enrich each vendor with their total spend and active PO count
    const enriched = await Promise.all(vendors.map(async (v) => {
      const activeOrders = await PurchaseOrder.countDocuments({ vendor: v._id, status: { $in: ["approved", "processing", "shipped", "partially_received"] } });
      const delivered    = await PurchaseOrder.find({ vendor: v._id, status: { $in: ["delivered", "invoiced", "closed"] } });
      const totalSpent   = delivered.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      return { ...v.toJSON(), activeOrders, totalSpent };
    }));

    res.json(enriched);
  } catch (err) { next(err); }
};

export const createVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json(vendor);
  } catch (err) { next(err); }
};

export const updateVendor = async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  } catch (err) { next(err); }
};

export const deleteVendor = async (req, res, next) => {
  try {
    await Vendor.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Vendor removed" });
  } catch (err) { next(err); }
};

// ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────

export const getPurchaseOrders = async (req, res, next) => {
  try {
    const { status, vendorId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (vendorId) filter.vendor = vendorId;

    const orders = await PurchaseOrder.find(filter)
      .populate("vendor", "name type")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) { next(err); }
};

export const createPurchaseOrder = async (req, res, next) => {
  try {
    const { vendorId, items, notes, expectedDelivery } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ message: "Vendor not found" });

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * (item.unitPrice || 0)), 0);

    const orderData = {
      vendor: vendorId,
      vendorName: vendor.name,
      items,
      notes,
      expectedDelivery,
      createdBy: req.user._id,
      totalAmount
    };

    // Auto-Approval Engine
    if (totalAmount < 5000) {
      orderData.status = "approved";
      orderData.approvedAt = new Date();
      orderData.approvals = [{
        approver: req.user._id,
        status: "approved",
        date: new Date()
      }];

      // Encumber the budget automatically
      const year = new Date().getFullYear();
      const budget = await Budget.findOne({ year });
      if (budget) {
        budget.encumbered += totalAmount;
        if (budget.allocations.length > 0) {
           const category = items[0]?.category || "General";
           const alloc = budget.allocations.find(a => a.category === category);
           if (alloc) alloc.encumbered += totalAmount;
        }
        await budget.save();
      }
    }

    const order = await PurchaseOrder.create(orderData);

    const populated = await order.populate("vendor", "name type");
    res.status(201).json(populated);
  } catch (err) { next(err); }
};

export const updatePurchaseOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const update = { status };
    if (status === "delivered") update.deliveredAt = new Date();

    const order = await PurchaseOrder.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("vendor", "name type");

    if (!order) return res.status(404).json({ message: "Order not found" });

    // If delivered, add the books to the library stock
    if (status === "delivered") {
      for (const item of order.items) {
        const existing = await Book.findOne({ title: item.title });
        if (existing) {
          existing.stock = (existing.stock || 1) + item.quantity;
          await existing.save();
        }
      }
    }

    res.json(order);
  } catch (err) { next(err); }
};

export const deletePurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order deleted" });
  } catch (err) { next(err); }
};

export const approvePurchaseOrder = async (req, res, next) => {
  try {
    const { status } = req.body; // "approved" or "rejected"
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "pending_approval") {
      return res.status(400).json({ message: "Order is not pending approval" });
    }

    order.approvals.push({
      approver: req.user._id,
      status
    });

    if (status === "approved") {
      order.status = "approved";
      order.approvedAt = new Date();
      
      // Encumber the budget
      const year = new Date().getFullYear();
      const budget = await Budget.findOne({ year });
      if (budget) {
        budget.encumbered += order.totalAmount;
        // Optionally map category
        if (budget.allocations.length > 0) {
           const category = order.items[0]?.category;
           const alloc = budget.allocations.find(a => a.category === category);
           if (alloc) alloc.encumbered += order.totalAmount;
        }
        await budget.save();
      }
    } else {
      order.status = "cancelled";
    }

    await order.save();
    res.json(order);
  } catch (err) { next(err); }
};

export const receivePurchaseOrderItems = async (req, res, next) => {
  try {
    const { itemsToReceive } = req.body; // array of { _id (item id), quantityToReceive }
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const receivedLogItems = [];
    let allFullyReceived = true;

    for (const reqItem of itemsToReceive) {
      const orderItem = order.items.id(reqItem._id);
      if (orderItem) {
        orderItem.receivedQuantity += reqItem.quantityToReceive;
        receivedLogItems.push({ title: orderItem.title, quantity: reqItem.quantityToReceive });
        
        // Add to library stock
        const existingBook = await Book.findOne({ title: orderItem.title });
        if (existingBook) {
          existingBook.stock = (existingBook.stock || 0) + reqItem.quantityToReceive;
          await existingBook.save();
        }

        if (orderItem.receivedQuantity < orderItem.quantity) {
          allFullyReceived = false;
        }
      }
    }

    order.receivingHistory.push({
      receivedBy: req.user._id,
      items: receivedLogItems
    });

    order.status = allFullyReceived ? "delivered" : "partially_received";
    if (allFullyReceived) {
      order.deliveredAt = new Date();
      
      // Auto-Invoicing Engine: Generate AP Invoice automatically upon full receipt
      try {
        const existingInvoice = await Invoice.findOne({ purchaseOrder: order._id });
        if (!existingInvoice) {
          await Invoice.create({
            invoiceNumber: `INV-${Date.now()}-${order.id.slice(-4).toUpperCase()}`,
            vendor: order.vendor,
            purchaseOrder: order._id,
            totalAmount: order.totalAmount,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Net 30 terms
            status: "pending",
            createdBy: req.user._id
          });
        }
      } catch (invoiceErr) {
        console.error("Auto-Invoicing failed:", invoiceErr);
      }
    }

    await order.save();
    res.json(order);
  } catch (err) { next(err); }
};

// ─── INVOICES ────────────────────────────────────────────────────────────────

export const getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find().populate("purchaseOrder").sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) { next(err); }
};

export const createInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(invoice);
  } catch (err) { next(err); }
};

export const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findById(req.params.id).populate("purchaseOrder");
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });

    if (status === "paid" && invoice.status !== "paid") {
      invoice.status = "paid";
      invoice.paidAt = new Date();

      // Convert Encumbered to Expended
      const year = new Date().getFullYear();
      const budget = await Budget.findOne({ year });
      if (budget) {
        const amount = invoice.totalAmount;
        budget.encumbered = Math.max(0, budget.encumbered - amount);
        budget.expended += amount;
        
        const category = invoice.purchaseOrder?.items[0]?.category;
        const alloc = budget.allocations.find(a => a.category === category);
        if (alloc) {
           alloc.encumbered = Math.max(0, alloc.encumbered - amount);
           alloc.expended += amount;
        }
        await budget.save();
      }
    } else {
      invoice.status = status;
      if (status === "matched") invoice.matchedAt = new Date();
    }

    await invoice.save();
    res.json(invoice);
  } catch (err) { next(err); }
};
