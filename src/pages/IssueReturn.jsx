import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { API_URL } from "../config";
import {
  FaBook, FaUser, FaCalendarAlt, FaCheckCircle, FaUndo,
  FaExclamationCircle, FaRupeeSign, FaAddressCard, FaExchangeAlt,
  FaArrowRight, FaClock, FaHistory, FaQrcode, FaSearch
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

import { useNavigate } from "react-router-dom";
import ScannerModal from "../components/ScannerModal";
import CheckoutModal from "../components/CheckoutModal";

export default function IssueReturn() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    bookId: "",
    memberId: "",
    days: 14,
    issueDate: todayStr,
  });

  const [scanner, setScanner] = useState({ isOpen: false, type: null });
  const [showCheckout, setShowCheckout] = useState(null);

  const handleScan = (decodedText) => {
    if (scanner.type === "book") {
      setForm((f) => ({ ...f, bookId: decodedText }));
      toast.success("Book scanned successfully!", { icon: '📸' });
    } else if (scanner.type === "member") {
      setForm((f) => ({ ...f, memberId: decodedText }));
      toast.success("Member scanned successfully!", { icon: '📸' });
    }
    setScanner({ isOpen: false, type: null });
  };

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const headers = { Authorization: `Bearer ${user?.token}` };

      const [booksRes, membersRes, txRes, resRes] = await Promise.all([
        fetch(`${API_URL}/api/books`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/members`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/transactions`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/reservations/all`, { headers, credentials: 'include' })
      ]);

      const booksData = await booksRes.json();
      const membersData = await membersRes.json();
      const txData = await txRes.json();
      const resData = await resRes.json();

      setBooks(Array.isArray(booksData) ? booksData : (booksData.books || []));
      setMembers(Array.isArray(membersData) ? membersData : []);
      setTransactions(Array.isArray(txData) ? txData : (txData.transactions || []));
      setReservations(Array.isArray(resData) ? resData : []);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || user.role !== "admin") {
      toast.error("Admin access required.");
      navigate("/dashboard");
      return;
    }
    fetchData();

    // Real-time updates for Admin Panel
    import("socket.io-client").then(({ io }) => {
      const socket = io(API_URL);
      socket.on("dashboard:update", () => {
        fetchData();
      });
      return () => socket.disconnect();
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!form.bookId || !form.memberId) {
      toast.error("Please select both a book and a member.");
      return;
    }

    const issueDate = new Date(form.issueDate);
    const due = new Date(issueDate);
    due.setDate(due.getDate() + Number(form.days));

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const res = await fetch(`${API_URL}/api/transactions/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        credentials: 'include',

        body: JSON.stringify({
          bookId: form.bookId,
          memberId: form.memberId,
          issueDate: form.issueDate,
          dueDate: due.toISOString().slice(0, 10)
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || "Issue failed");
        return;
      }

      toast.success("Book issued successfully");
      setForm((f) => ({ ...f, bookId: "", memberId: "" }));
      fetchData();
    } catch (err) {
      toast.error("Failed to issue book");
    }
  };

  const handleReturn = async (id, currentPenalty) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const res = await fetch(`${API_URL}/api/transactions/return/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user?.token}` },
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || "Return failed");
        return;
      }

      toast.success("Book returned successfully");
      
      // Automate payment popup if there is a fine
      if (currentPenalty > 0) {
        handlePayFine(id, currentPenalty);
      } else {
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to return book");
    }
  };

  const handleMarkLost = async (id) => {
    if (!window.confirm("Are you sure you want to mark this book as lost? The replacement cost will be charged to the student.")) return;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const res = await fetch(`${API_URL}/api/transactions/${id}/lost`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user?.token}` },
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to mark as lost");
        return;
      }
      toast.success("Book marked as lost and fines applied.");
      fetchData();
    } catch (err) {
      toast.error("Failed to mark as lost");
    }
  };

  const handleFulfillReservation = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const res = await fetch(`${API_URL}/api/reservations/${id}/fulfill`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${user?.token}` },
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.message || "Fulfillment failed");
        return;
      }

      toast.success("Reservation fulfilled and book issued!");
      fetchData();
    } catch (err) {
      toast.error("Failed to fulfill reservation");
    }
  };

  const handleBumpReservation = async (id) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const headers = { Authorization: `Bearer ${user.token}` };
      
      const res = await fetch(`${API_URL}/api/reservations/${id}/bump`, {
        method: "PATCH",
        headers,
      });

      if (res.ok) {
        toast.success("Priority bumped successfully! ⚡");
        // refresh data
        const refreshRes = await fetch(`${API_URL}/api/reservations/all`, { headers, credentials: 'include' });
        if (refreshRes.ok) setReservations(await refreshRes.json());
      } else {
        toast.error("Failed to bump priority");
      }
    } catch (err) {
      toast.error("An error occurred");
    }
  };

  const handlePayFine = async (id, amount) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`
      };

      // Create Order
      const resOrder = await fetch(`${API_URL}/api/payments/create-order`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ amount }),
      });
      const order = await resOrder.json();

      if (order.key_id && order.key_id !== "rzp_test_placeholder") {
        // Real Razorpay Flow
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: "Library System",
          description: "Library Fines & Dues",
          order_id: order.id,
          handler: async (response) => {
            try {
              // Verify Real Payment
              await fetch(`${API_URL}/api/payments/verify`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                  ...response,
                  amount,
                  planName: "Fine Payment"
                })
              });

              await clearFine(id, authHeaders);
              toast.success("Payment Successful!", { icon: "💳" });
            } catch (err) {
              toast.error("Payment verification failed.");
            }
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#4f46e5" }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback to Simulation UI if keys are missing
        setShowCheckout({ amount, id, order });
      }
    } catch (err) {
      toast.error("Failed to initialize payment gateway.");
    }
  };

  const clearFine = async (id, authHeaders) => {
    try {
      const res = await fetch(`${API_URL}/api/transactions/pay-fine/${id}`, {
        method: "PATCH",
        headers: authHeaders,
        credentials: 'include'
      });

      if (!res.ok) {
        toast.error("Fine payment failed to record.");
        return;
      }
      fetchData();
    } catch (err) {
      toast.error("Failed to record fine payment.");
    }
  };

  const clearAllFines = async (memberId, authHeaders) => {
    try {
      const res = await fetch(`${API_URL}/api/transactions/pay-all-fines/${memberId}`, {
        method: "PATCH",
        headers: authHeaders,
        credentials: 'include'
      });

      if (!res.ok) {
        toast.error("Failed to clear fines.");
        return;
      }
      fetchData();
    } catch (err) {
      toast.error("Failed to clear fines.");
    }
  };

  const handlePayAllFines = async (memberId, amount) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`
      };

      const resOrder = await fetch(`${API_URL}/api/payments/create-order`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ amount }),
      });
      const order = await resOrder.json();

      if (order.key_id && order.key_id !== "rzp_test_placeholder") {
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: "Library System",
          description: "Clear All Fines",
          order_id: order.id,
          handler: async (response) => {
            try {
              await fetch(`${API_URL}/api/payments/verify`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                  ...response,
                  amount,
                  planName: "Fine Payment"
                })
              });
              await clearAllFines(memberId, authHeaders);
              toast.success("Payment Successful!", { icon: "💳" });
            } catch (err) {
              toast.error("Payment verification failed.");
            }
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#4f46e5" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setShowCheckout({ amount, memberId, order, isAll: true });
      }
    } catch (err) {
      toast.error("Failed to initialize payment gateway.");
    }
  };

  const handleMockPaymentSuccess = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`
      };
      
      const txIdToPay = showCheckout.id;
      
      // Verify mock order
      await fetch(`${API_URL}/api/payments/verify`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          razorpay_order_id: showCheckout.order?.id || `mock_order_${Date.now()}`,
          isMock: true,
          planName: "Fine Payment",
          amount: showCheckout.amount
        })
      });

      if (showCheckout.isAll) {
        await clearAllFines(showCheckout.memberId, authHeaders);
      } else {
        await clearFine(showCheckout.id, authHeaders);
      }
      
      toast.success("Payment Successful!");
      setShowCheckout(null);
    } catch (err) {
      toast.error("Payment failed to verify.");
    }
  };

  const ledgerRef = React.useRef(null);

  const handleExport = () => {
    const toastId = toast.loading("Generating report...");
    try {
      if (!transactions || transactions.length === 0) {
        toast.error("No data available for export.", { id: toastId });
        return;
      }

      const headers = ["Book", "Member", "Issue Date", "Due Date", "Status", "Fine", "Fine Status"];

      const escapeCSV = (str) => {
        if (str === null || str === undefined) return "";
        const stringVal = String(str);
        if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n")) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      };

      const rows = transactions.map(t => [
        escapeCSV(t.bookId?.title),
        escapeCSV(t.memberId?.name),
        escapeCSV(new Date(t.issueDate).toLocaleDateString()),
        escapeCSV(new Date(t.dueDate).toLocaleDateString()),
        escapeCSV(t.status),
        escapeCSV((t.returned ? t.penalty : t.currentPenalty || 0).toFixed(2)),
        escapeCSV(t.finePaid ? "Paid" : "Unpaid")
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `library_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Report downloaded", { id: toastId });
    } catch (err) {
      console.error("Export Error:", err);
      toast.error("Report generation failed.", { id: toastId });
    }
  };

  const scrollToTransactions = () => {
    if (ledgerRef.current) {
      ledgerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      toast.success("Opening transaction history", { icon: "📜" });
    }
  };

  const availableBooks = books.filter(b => b.status === "Available");

  return (
    <div className="bg-slate-50 dark:bg-[#020617] min-h-screen p-6 md:p-8 font-sans transition-colors duration-500 pb-20 selection:bg-indigo-100">
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal 
            amount={showCheckout.amount} 
            onComplete={handleMockPaymentSuccess} 
            onClose={() => setShowCheckout(null)} 
          />
        )}
      </AnimatePresence>

      {/* 🏙️ ELITE HEADER SECTION */}
      <div className="max-w-[1400px] mx-auto mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md group transition-all">
              <FaExchangeAlt className="text-white text-xl" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Library</span>
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Book Issue & Return</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Manage Book Transactions</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400 font-medium text-base max-w-xl">Check books in or out and keep track of your library items.</p>
        </motion.div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-3 mr-4 pr-4 border-r border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Transactions</p>
              <p className="text-xl font-black tracking-tight">{transactions.length}</p>
            </div>
            <div className="px-6 py-4 bg-indigo-600 rounded-xl shadow-md text-white">
              <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Books Issued</p>
              <p className="text-xl font-black tracking-tight">{transactions.filter(t => !t.returned).length}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="px-6 py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black text-[10px] font-medium tracking-wide rounded-xl border border-slate-200 dark:border-slate-200 dark:border-slate-800 shadow-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 group"
            >
              <FaAddressCard className="text-indigo-600 transition-transform" /> Download Report
            </button>
            <button
              className="px-6 py-3 bg-slate-950 text-white font-black text-[10px] font-medium tracking-wide rounded-xl shadow-md hover:bg-slate-900 transition-all flex items-center gap-2 group active:scale-95"
              onClick={scrollToTransactions}
            >
              <FaHistory className="text-indigo-400 transition-transform duration-700" /> View History
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-10">

        {/* 🛠️ ISSUE CONTROL PANEL */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-800 relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-8 h-8 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center"><FaAddressCard size={14} /></div>
              <h3 className="text-lg font-bold tracking-tight">Issue Book</h3>
            </div>

            <form onSubmit={handleIssue} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select Book</label>
                  <button type="button" onClick={() => setScanner({ isOpen: true, type: 'book' })} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-600 transition-colors">
                    <FaQrcode size={12} /> Scan Book
                  </button>
                </div>
                <select
                  name="bookId"
                  value={form.bookId}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all"
                >
                  <option value="">Select a Book</option>
                  {availableBooks.map((b) => (
                    <option key={b.id || b._id} value={b.id || b._id}>{b.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Select Member</label>
                  <button type="button" onClick={() => setScanner({ isOpen: true, type: 'member' })} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-600 transition-colors">
                    <FaQrcode size={12} /> Scan Member
                  </button>
                </div>
                <select
                  name="memberId"
                  value={form.memberId}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm transition-all"
                >
                  <option value="">Select a Member</option>
                  {members.map((m) => (
                    <option key={m.id || m._id} value={m.id || m._id}>{m.name}</option>
                  ))}
                </select>
                {form.memberId && (() => {
                  const selectedMember = members.find(m => (m.id || m._id) === form.memberId);
                  if (selectedMember && selectedMember.totalFine > 0) {
                    return (
                      <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                          <FaExclamationCircle />
                          <span className="text-xs font-bold uppercase tracking-wide">Outstanding Dues:</span>
                          <span className="text-sm font-black">₹{selectedMember.totalFine.toFixed(2)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePayAllFines(form.memberId, selectedMember.totalFine)}
                          className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-rose-700 transition-all"
                        >
                          Clear Dues
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Issue Date</label>
                  <input
                    type="date"
                    name="issueDate"
                    value={form.issueDate}
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Duration (days)</label>
                  <input
                    type="number"
                    name="days"
                    min={1}
                    value={form.days}
                    onChange={handleChange}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-md flex justify-center items-center gap-2 mt-2 group"
              >
                Issue Book <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>

        {/* 📜 CIRCULATION LEDGER */}
        <div className="lg:col-span-2" ref={ledgerRef}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-indigo-500 text-white rounded-xl flex items-center justify-center shadow-md"><FaHistory size={14} /></div>
                <h3 className="text-xl font-bold tracking-tight">Recent Transactions</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by book or member..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-indigo-500 w-64"
                  />
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline-block">Live Updates</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left min-w-[600px] md:min-w-0">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 font-medium tracking-wide border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Book Title</th>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4 text-center">Fine Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {transactions
                    .filter(tx => {
                      const searchStr = searchQuery.toLowerCase();
                      const bookTitle = (tx.bookId?.title || "").toLowerCase();
                      const memberName = (tx.memberId?.name || "").toLowerCase();
                      const memberEmail = (tx.memberId?.email || "").toLowerCase();
                      return bookTitle.includes(searchStr) || memberName.includes(searchStr) || memberEmail.includes(searchStr);
                    })
                    .map((tx) => {
                    const isOverdue = !tx.returned && new Date() > new Date(tx.dueDate);
                    const fine = tx.returned ? (tx.penalty || 0) : (tx.currentPenalty || 0);

                    return (
                      <tr key={tx.id || tx._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all border-b border-slate-200 dark:border-slate-800/50 last:border-0">
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{tx.bookId?.title || "Book"}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{tx.bookId?.author || "Library System"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><FaUser size={10} /></div>
                            <p className="text-sm font-medium">{tx.memberId?.name || "Anonymous"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col items-center">
                            {fine > 0 ? (
                              <>
                                <div className="flex items-center gap-1 text-rose-500">
                                  <FaRupeeSign size={10} className="font-bold" />
                                  <span className="text-base font-black tracking-tight">{fine.toFixed(2)}</span>
                                </div>
                                <span className={`text-[8px] font-semibold tracking-wide mt-1 px-2 py-0.5 rounded ${tx.finePaid ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                                  {tx.returned ? (tx.finePaid ? 'Paid' : 'Unpaid') : 'Pending'}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-700 font-bold">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {tx.isLost ? (
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 text-rose-500 rounded-full border border-rose-500/20">
                              <FaExclamationCircle size={10} />
                              <span className="text-sm font-semibold">Lost</span>
                            </div>
                          ) : tx.returned ? (
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                              <FaCheckCircle size={10} />
                              <span className="text-sm font-semibold">Returned</span>
                            </div>
                          ) : (
                            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${isOverdue ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                              <FaClock size={10} />
                              <span className="text-sm font-semibold">{isOverdue ? 'Overdue' : 'Issued'}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {!tx.returned && !tx.isLost ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleMarkLost(tx.id || tx._id)}
                                  className="px-4 py-2 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-600 hover:text-white transition-all shadow-md"
                                >
                                  Mark Lost
                                </button>
                                <button
                                  onClick={() => handleReturn(tx.id || tx._id, tx.currentPenalty || 0)}
                                  className="px-4 py-2 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-600 hover:text-white transition-all shadow-md"
                                >
                                  Return Book
                                </button>
                              </div>
                            ) : (
                              tx.penalty > 0 && !tx.finePaid ? (
                                <button
                                  onClick={() => handlePayFine(tx.id || tx._id, fine)}
                                  className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-rose-700 transition-all"
                                >
                                  Pay Fine
                                </button>
                              ) : (
                                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center"><FaCheckCircle size={14} /></div>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 🚀 WAITLISTS & RESERVATIONS */}
      <div className="max-w-[1400px] mx-auto mt-10">
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-md"><FaClock size={14} /></div>
                <h3 className="text-xl font-bold tracking-tight">Pending Waitlists & Reservations</h3>
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left min-w-[600px] md:min-w-0">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 font-medium tracking-wide border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4">Book Title</th>
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Request Date</th>
                    <th className="px-6 py-4">Priority / Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {reservations.filter(r => r.status === 'Pending').map((res) => (
                    <tr key={res.id || res._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all border-b border-slate-200 dark:border-slate-800/50 last:border-0">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{res.bookId?.title || "Book"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><FaUser size={10} /></div>
                          <p className="text-sm font-medium">{res.userId?.name || "Member"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium">{new Date(res.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 max-w-max">
                            <span className="text-sm font-semibold">Pending</span>
                          </div>
                          {res.priority > 0 && (
                            <div className="inline-flex items-center gap-1 text-xs font-bold text-indigo-500">
                              ⚡ Priority: {res.priority}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleBumpReservation(res.id || res._id)}
                            className="px-3 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-100 transition-all border border-indigo-200 dark:border-indigo-500/20 flex items-center gap-1"
                            title="Bump to top of waitlist"
                          >
                            ⚡ Bump
                          </button>
                          <button
                            onClick={() => handleFulfillReservation(res.id || res._id)}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-md hover:bg-indigo-700 transition-all"
                          >
                            Fulfill
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {reservations.filter(r => r.status === 'Pending').length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-slate-400 font-medium">No pending reservations or waitlists.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
      </div>

      <ScannerModal 
        isOpen={scanner.isOpen} 
        onClose={() => setScanner({ isOpen: false, type: null })} 
        onScan={handleScan}
        title={scanner.type === 'book' ? "Scan Book Barcode" : "Scan Member Card"}
      />
    </div>
  );
}
