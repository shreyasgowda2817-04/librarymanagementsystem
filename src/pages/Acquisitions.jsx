import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  Banknote, TrendingUp, Wallet, Building2, ShoppingCart,
  Plus, Search, CheckCircle, Clock, Truck,
  X, AlertCircle, Loader, Trash2, RefreshCw, Edit3, Settings2
} from "lucide-react";
import { API_URL } from "../config";
import toast from "react-hot-toast";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getToken = () => JSON.parse(localStorage.getItem("user") || "null")?.token;

const apiFetch = async (path, opts = {}) => {
  const res = await fetch(`${API_URL}/api/acquisitions${path}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
    ...opts
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
};

const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const STATUS_CONFIG = {
  pending_approval: { label: "Pending Approval", icon: Clock, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/20" },
  approved:   { label: "Approved",   icon: CheckCircle,   color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-100 dark:bg-indigo-500/20" },
  processing: { label: "Processing", icon: Clock,         color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-100 dark:bg-amber-500/20" },
  shipped:    { label: "Shipped",    icon: Truck,         color: "text-sky-600 dark:text-sky-400",      bg: "bg-sky-100 dark:bg-sky-500/20" },
  partially_received: { label: "Partial", icon: Truck, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-500/20" },
  delivered:  { label: "Delivered",  icon: CheckCircle,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/20" },
  invoiced:   { label: "Invoiced",   icon: Banknote,      color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/20" },
  closed:     { label: "Closed",     icon: CheckCircle,   color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-500/20" },
  cancelled:  { label: "Cancelled",  icon: X,             color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-100 dark:bg-rose-500/20" }
};

const PIE_COLORS = ["#4f46e5","#0ea5e9","#f43f5e","#8b5cf6","#10b981","#f59e0b","#ec4899"];

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ title, value, subtitle, Icon, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.45 }}
      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden group shadow-sm"
    >
      <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-[0.08] group-hover:scale-150 transition-transform duration-700 ${accent}`} />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{title}</p>
          <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">{value}</h3>
          <p className="text-xs font-semibold text-slate-400 mt-2">{subtitle}</p>
        </div>
        <div className={`p-3.5 rounded-xl ${accent} bg-opacity-10 dark:bg-opacity-15`}>
          <Icon size={22} className={`${accent.replace("bg-","text-")}`} />
        </div>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || {};
  const Icon = cfg.icon || Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${cfg.bg} ${cfg.color}`}>
      <Icon size={11} /> {cfg.label}
    </span>
  );
}

// ─── Modals ──────────────────────────────────────────────────────────────────

function AddVendorModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ name: "", type: "General", email: "", phone: "", address: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/vendors", { method: "POST", body: JSON.stringify(form) });
      toast.success("Vendor added!");
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-black">New Vendor</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {[["name","Vendor Name","text",true],["type","Type (e.g. Tech Publisher)","text",false],["email","Email","email",false],["phone","Phone","text",false],["address","Address","text",false]].map(([key,label,type,req]) => (
            <div key={key}>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{label}</label>
              <input required={req} type={type} value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors" />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />} Add Vendor
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AddOrderModal({ vendors, onClose, onSaved }) {
  const [form, setForm] = useState({ vendorId: "", notes: "", expectedDelivery: "", items: [{ title: "", quantity: 1, unitPrice: 0, category: "General" }] });
  const [loading, setLoading] = useState(false);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { title: "", quantity: 1, unitPrice: 0, category: "General" }] }));
  const removeItem = (i) => setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  const setItem = (i, key, val) => setForm(f => {
    const items = [...f.items]; items[i] = { ...items[i], [key]: val }; return { ...f, items };
  });

  const total = form.items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice), 0);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch("/orders", { method: "POST", body: JSON.stringify(form) });
      toast.success("Purchase order created!");
      onSaved();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-lg font-black">New Purchase Order</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Vendor</label>
              <select required value={form.vendorId} onChange={e => setForm(f => ({...f, vendorId: e.target.value}))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500">
                <option value="">Select Vendor...</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Expected Delivery</label>
              <input type="date" value={form.expectedDelivery} onChange={e => setForm(f => ({...f, expectedDelivery: e.target.value}))}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Order Items</label>
              <button type="button" onClick={addItem} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"><Plus size={12}/> Add Item</button>
            </div>
            <div className="space-y-3">
              {form.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input placeholder="Book Title" value={item.title} onChange={e => setItem(i,"title",e.target.value)} required
                    className="col-span-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <input placeholder="Qty" type="number" min="1" value={item.quantity} onChange={e => setItem(i,"quantity",e.target.value)}
                    className="col-span-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <input placeholder="Unit Price" type="number" min="0" value={item.unitPrice} onChange={e => setItem(i,"unitPrice",e.target.value)}
                    className="col-span-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <button type="button" onClick={() => removeItem(i)} className="col-span-2 p-2 text-slate-400 hover:text-rose-500 flex justify-center"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 resize-none" />
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-sm font-bold">Total: <span className="text-indigo-600 text-lg">{fmt(total)}</span></div>
            <button type="submit" disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-60">
              {loading ? <Loader size={16} className="animate-spin" /> : <ShoppingCart size={16} />} Create Order
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Budget Editor Modal ─────────────────────────────────────────────────────

function SetBudgetModal({ budget, onClose, onSaved }) {
  const [totalBudget, setTotalBudget] = useState(budget?.budget?.totalBudget || 120000);
  const [allocations, setAllocations] = useState(
    budget?.budget?.allocations?.length
      ? budget.budget.allocations.map(a => ({ ...a }))
      : [{ category: "Computer Science", amount: 45000, color: "#4f46e5" }]
  );
  const [loading, setLoading] = useState(false);

  const addCategory = () => setAllocations(a => [...a, { category: "", amount: 0, color: "#4f46e5" }]);
  const removeCategory = (i) => setAllocations(a => a.filter((_, idx) => idx !== i));
  const setAlloc = (i, key, val) => setAllocations(a => {
    const next = [...a]; next[i] = { ...next[i], [key]: val }; return next;
  });

  const allocTotal = allocations.reduce((s, a) => s + Number(a.amount), 0);
  const diff = totalBudget - allocTotal;

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // API now returns full getBudget-shaped response
      const updated = await apiFetch("/budget", { method: "PUT", body: JSON.stringify({ totalBudget: Number(totalBudget), allocations }) });
      toast.success("Budget updated successfully!");
      onSaved(updated); // pass data directly to parent
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-lg font-black flex items-center gap-2"><Settings2 size={18} className="text-indigo-500" /> Set Annual Budget</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X size={18} /></button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-6">
          {/* Total Budget */}
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Total Annual Budget (₹)</label>
            <input
              type="number" min="0" required
              value={totalBudget}
              onChange={e => setTotalBudget(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-indigo-500 rounded-xl px-4 py-3 text-2xl font-black outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Category Allocations */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Category Allocations</label>
              <button type="button" onClick={addCategory} className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                <Plus size={12} /> Add Category
              </button>
            </div>

            <div className="space-y-3">
              {allocations.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={a.color} onChange={e => setAlloc(i, "color", e.target.value)}
                    className="w-8 h-9 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0 p-0.5 bg-transparent" />
                  <input placeholder="Category name" value={a.category} onChange={e => setAlloc(i, "category", e.target.value)} required
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <input type="number" min="0" placeholder="Amount" value={a.amount} onChange={e => setAlloc(i, "amount", e.target.value)}
                    className="w-28 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500" />
                  <button type="button" onClick={() => removeCategory(i)} className="p-2 text-slate-400 hover:text-rose-500 shrink-0"><Trash2 size={14}/></button>
                </div>
              ))}
            </div>

            {/* Allocation summary */}
            <div className={`mt-4 p-3 rounded-xl text-sm font-bold flex justify-between ${diff < 0 ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"}`}>
              <span>Allocated: ₹{allocTotal.toLocaleString("en-IN")}</span>
              <span>{diff >= 0 ? `₹${diff.toLocaleString("en-IN")} unallocated` : `Over by ₹${Math.abs(diff).toLocaleString("en-IN")}`}</span>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            {loading ? <Loader size={16} className="animate-spin" /> : <Banknote size={16} />} Save Budget
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Acquisitions() {
  const [activeTab, setActiveTab] = useState("overview");
  const [budget, setBudget]     = useState(null);
  const [vendors, setVendors]   = useState([]);
  const [orders, setOrders]     = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showAddOrder, setShowAddOrder]   = useState(false);
  const [showSetBudget, setShowSetBudget] = useState(false);
  const [updatingId, setUpdatingId]       = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bData, vData, oData, iData] = await Promise.all([
        apiFetch("/budget"),
        apiFetch("/vendors"),
        apiFetch("/orders"),
        apiFetch("/invoices").catch(() => [])
      ]);
      setBudget(bData);
      setVendors(vData);
      setOrders(oData);
      setInvoices(iData);
    } catch (err) {
      toast.error("Failed to load data: " + err.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/orders/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      toast.success(`Order marked as ${status}`);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setUpdatingId(null); }
  };

  const approveOrder = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/orders/${orderId}/approve`, { method: "PUT", body: JSON.stringify({ status }) });
      toast.success(status === "approved" ? "Order Approved!" : "Order Rejected");
      load();
    } catch (err) { toast.error(err.message); }
    finally { setUpdatingId(null); }
  };

  const receiveItems = async (orderId, itemsToReceive) => {
    setUpdatingId(orderId);
    try {
      await apiFetch(`/orders/${orderId}/receive`, { method: "PUT", body: JSON.stringify({ itemsToReceive }) });
      toast.success("Items received and logged");
      load();
    } catch (err) { toast.error(err.message); }
    finally { setUpdatingId(null); }
  };

  const updateInvoice = async (invoiceId, status) => {
    setUpdatingId(invoiceId);
    try {
      await apiFetch(`/invoices/${invoiceId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
      toast.success(`Invoice marked as ${status}`);
      load();
    } catch (err) { toast.error(err.message); }
    finally { setUpdatingId(null); }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm("Delete this order?")) return;
    try {
      await apiFetch(`/orders/${orderId}`, { method: "DELETE" });
      toast.success("Order deleted");
      load();
    } catch (err) { toast.error(err.message); }
  };

  const filteredOrders = orders.filter(o =>
    o.orderId?.toLowerCase().includes(search.toLowerCase()) ||
    o.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    o.items?.some(i => i.title.toLowerCase().includes(search.toLowerCase()))
  );

  const ytd  = budget?.ytdSpend ?? 0;
  const total = budget?.budget?.totalBudget ?? 0;
  const remaining = budget?.remaining ?? 0;
  const pct = total > 0 ? Math.round((ytd / total) * 100) : 0;

  // Build pie data from real allocations
  const pieData = (budget?.budget?.allocations || []).map((a, i) => ({
    name: a.category, value: a.amount, color: a.color || PIE_COLORS[i % PIE_COLORS.length]
  }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-100 pb-20">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-8 pb-0 px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Acquisitions & Budget</h1>
            <p className="text-slate-500 text-sm mt-1 font-medium">Manage library procurement, vendors, and financial health.</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <button onClick={load} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="Refresh">
                <RefreshCw size={16} />
              </button>
              <button onClick={() => setShowSetBudget(true)}
                className="px-4 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center gap-2 transition-colors">
                <Edit3 size={14} /> Set Budget
              </button>
              <button onClick={() => setShowAddVendor(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-sm font-bold transition-colors text-slate-700 dark:text-slate-300">
                + Vendor
              </button>
              <button onClick={() => setShowAddOrder(true)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.25)]">
                <Plus size={16} /> New Order
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto flex gap-6 border-b border-slate-200 dark:border-slate-800">
          {["overview", "purchase_orders", "invoices", "vendors"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`pb-4 px-1 text-sm font-bold capitalize tracking-wide transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-transparent"
              }`}>
              {tab.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8">

        {loading ? (
          <div className="flex items-center justify-center h-64 gap-4">
            <Loader size={32} className="animate-spin text-indigo-500" />
            <p className="text-slate-500 font-semibold">Loading financial data...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">

            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <KpiCard title="Total Annual Budget" value={fmt(total)}    subtitle={`FY ${new Date().getFullYear()} Allocation`} Icon={Wallet}     accent="bg-indigo-600" delay={0.1} />
                  <KpiCard title="Encumbered"          value={fmt(budget?.encumbered || 0)} subtitle="Reserved for open POs"         Icon={Clock}       accent="bg-amber-500" delay={0.2} />
                  <KpiCard title="YTD Expenditure"     value={fmt(budget?.expended || 0)} subtitle="Paid Invoices"                 Icon={TrendingUp}  accent="bg-rose-500"   delay={0.3} />
                  <KpiCard title="Remaining Funds"     value={fmt(budget?.remaining || 0)} subtitle="Available for Procurement"                  Icon={Banknote}    accent="bg-emerald-500" delay={0.4} />
                </div>

                {/* Budget Progress Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                  <div className="flex justify-between text-sm font-semibold mb-3">
                    <span className="text-slate-500">Budget Utilisation</span>
                    <span className={pct > 85 ? "text-rose-500 font-bold" : "text-slate-700 dark:text-slate-300"}>{pct}%</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${pct > 85 ? "bg-rose-500" : pct > 60 ? "bg-amber-500" : "bg-indigo-600"}`} />
                  </div>
                  {pct > 85 && (
                    <div className="flex items-center gap-2 mt-3 text-rose-500 text-xs font-bold">
                      <AlertCircle size={14} /> Budget is above 85% — consider reviewing procurement.
                    </div>
                  )}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Area Chart */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <h3 className="text-base font-bold mb-6 flex items-center gap-2">
                      <TrendingUp size={18} className="text-indigo-500" /> Monthly Spending Trend
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={budget?.monthly || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} tickFormatter={v => `₹${v >= 1000 ? (v/1000)+"k" : v}`} />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700 }}
                            formatter={v => [fmt(v), "Spent"]} />
                          <Area type="monotone" dataKey="amount" stroke="#4f46e5" strokeWidth={2.5} fill="url(#spendGrad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie Chart */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                      <Wallet size={18} className="text-rose-500" /> Budget by Category
                    </h3>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700 }}
                            formatter={v => [fmt(v), "Allocated"]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {pieData.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                          <span className="text-[10px] font-bold text-slate-500 truncate" title={c.name}>{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── PURCHASE ORDERS ── */}
            {activeTab === "purchase_orders" && (
              <motion.div key="orders" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-900/60">
                    <h3 className="text-base font-bold flex items-center gap-2"><ShoppingCart size={18} className="text-indigo-500" /> Purchase Orders ({orders.length})</h3>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
                        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm font-medium outline-none focus:border-indigo-500 transition-colors w-60" />
                    </div>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <ShoppingCart size={40} className="mb-4 opacity-30" />
                      <p className="font-bold">No purchase orders found.</p>
                      {isAdmin && <button onClick={() => setShowAddOrder(true)} className="mt-3 text-indigo-500 font-bold text-sm hover:underline">+ Create your first order</button>}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase tracking-widest font-black">
                            {["PO ID","Vendor","Items","Amount","Date","Status","Actions"].map(h => (
                              <th key={h} className="px-5 py-3.5 font-black">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                          {filteredOrders.map(o => (
                            <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{o.orderId}</td>
                              <td className="px-5 py-4 font-semibold">{o.vendorName || o.vendor?.name || "—"}</td>
                              <td className="px-5 py-4 text-slate-500 max-w-[180px] truncate">
                                {o.items?.map(i => `${i.quantity}x ${i.title}`).join(", ")}
                              </td>
                              <td className="px-5 py-4 font-bold">{fmt(o.totalAmount)}</td>
                              <td className="px-5 py-4 text-slate-400 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                              <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                              <td className="px-5 py-4">
                                {isAdmin && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    {o.status === "pending_approval" && (
                                      <>
                                        <button onClick={() => approveOrder(o.id, "approved")} className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md">Approve</button>
                                        <button onClick={() => approveOrder(o.id, "rejected")} className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-1 rounded-md">Reject</button>
                                      </>
                                    )}
                                    {(o.status === "approved" || o.status === "partially_received" || o.status === "shipped") && (
                                      <button onClick={() => {
                                        const qty = prompt("How many items did you receive (total)?", "1");
                                        if (qty) receiveItems(o.id, [{ _id: o.items[0]._id, quantityToReceive: Number(qty) }]);
                                      }} className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">Receive</button>
                                    )}
                                    {o.status !== "delivered" && o.status !== "cancelled" && o.status !== "closed" && o.status !== "pending_approval" && (
                                      <select
                                        value={o.status}
                                        disabled={updatingId === o.id}
                                        onChange={e => changeStatus(o.id, e.target.value)}
                                        className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                                      >
                                        <option value="approved">Approved</option>
                                        <option value="processing">Processing</option>
                                        <option value="shipped">Shipped</option>
                                        <option value="partially_received">Partial</option>
                                        <option value="delivered">Delivered</option>
                                        <option value="invoiced">Invoiced</option>
                                        <option value="cancelled">Cancelled</option>
                                      </select>
                                    )}
                                    <button onClick={() => deleteOrder(o.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14}/></button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── INVOICES ── */}
            {activeTab === "invoices" && (
              <motion.div key="invoices" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/60">
                    <h3 className="text-base font-bold flex items-center gap-2"><Banknote size={18} className="text-emerald-500" /> Accounts Payable ({invoices.length})</h3>
                  </div>
                  {invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <Banknote size={40} className="mb-4 opacity-30" />
                      <p className="font-bold">No invoices to process.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-[10px] uppercase tracking-widest font-black">
                            {["Invoice #", "PO", "Amount", "Status", "Actions"].map(h => (
                              <th key={h} className="px-5 py-3.5 font-black">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                          {invoices.map(inv => (
                            <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-5 py-4 font-bold">{inv.invoiceNumber}</td>
                              <td className="px-5 py-4 text-indigo-600">{inv.purchaseOrder?.orderId || "—"}</td>
                              <td className="px-5 py-4 font-bold">{fmt(inv.totalAmount)}</td>
                              <td className="px-5 py-4">
                                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${inv.status === "paid" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                                  {inv.status}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                {inv.status !== "paid" && (
                                  <button onClick={() => updateInvoice(inv.id, "paid")} className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">Mark Paid</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── VENDORS ── */}
            {activeTab === "vendors" && (
              <motion.div key="vendors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {vendors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                    <Building2 size={48} className="mb-4 opacity-30" />
                    <p className="font-bold text-lg">No vendors yet.</p>
                    {isAdmin && <button onClick={() => setShowAddVendor(true)} className="mt-3 text-indigo-500 font-bold hover:underline">+ Add your first vendor</button>}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {vendors.map(v => (
                      <motion.div key={v.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/30 hover:shadow-md transition-all group">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform">
                          <Building2 size={20} />
                        </div>
                        <h4 className="font-bold text-lg leading-tight mb-1">{v.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">{v.type}</p>
                        {v.email && <p className="text-xs text-slate-500 mb-1 truncate">✉ {v.email}</p>}
                        {v.phone && <p className="text-xs text-slate-500 mb-4 truncate">📞 {v.phone}</p>}
                        <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Total Spent</span>
                            <span className="font-bold">{fmt(v.totalSpent || 0)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Active Orders</span>
                            <span className="font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md">{v.activeOrders || 0}</span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* Modals */}
      {showAddVendor  && <AddVendorModal onClose={() => setShowAddVendor(false)} onSaved={() => { setShowAddVendor(false); load(); }} />}
      {showAddOrder   && <AddOrderModal vendors={vendors} onClose={() => setShowAddOrder(false)} onSaved={() => { setShowAddOrder(false); load(); /* reload budget too */ }} />}
      {showSetBudget  && <SetBudgetModal budget={budget} onClose={() => setShowSetBudget(false)} onSaved={(newBudget) => { setBudget(newBudget); setShowSetBudget(false); }} />}
    </div>
  );
}
