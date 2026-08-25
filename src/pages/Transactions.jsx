import React, { useState, useEffect } from "react";
import { API_URL } from "../config";
import { FaFileInvoiceDollar, FaDownload, FaSpinner, FaSearch, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/transactions/my-transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setTransactions(data.transactions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (txn) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("INVOICE", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Transaction ID: ${txn.transactionId || txn._id}`, 14, 32);
    doc.text(`Payment ID: ${txn.paymentId || 'N/A'}`, 14, 38);
    doc.text(`Date: ${new Date(txn.timestamp || txn.createdAt).toLocaleString()}`, 14, 44);
    
    doc.autoTable({
      startY: 55,
      head: [['Description', 'Amount', 'Status']],
      body: [
        [txn.paymentType || 'General Payment', `₹${txn.amount}`, txn.status]
      ],
    });
    
    doc.save(`Invoice_${txn.transactionId || txn._id}.pdf`);
  };

  const filteredTxns = transactions.filter(t => 
    (t.transactionId || t._id).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.paymentType || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <FaFileInvoiceDollar className="text-indigo-600" />
            Transaction History
          </h1>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Review your recent payments</p>
        </div>
        
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-indigo-500 text-sm font-medium w-64 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4 text-indigo-500">
            <FaSpinner className="animate-spin" size={40} />
            <p className="text-xs font-bold uppercase tracking-widest">Loading Records...</p>
          </div>
        ) : filteredTxns.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4 text-slate-400">
            <FaFileInvoiceDollar size={40} className="opacity-50" />
            <p className="text-xs font-bold uppercase tracking-widest">No transactions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs font-black uppercase tracking-widest text-slate-500">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxns.map((txn, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ delay: i * 0.05 }}
                    key={txn._id} 
                    className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-800 dark:text-white">{txn.transactionId || txn._id}</span>
                        {txn.paymentId && <span className="text-[10px] text-slate-400 font-mono">PID: {txn.paymentId}</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-md text-xs font-bold">
                        {txn.paymentType || 'Payment'}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-black text-slate-800 dark:text-white">
                      ₹{txn.amount}
                    </td>
                    <td className="p-4">
                      {txn.status === 'success' || txn.status === 'completed' ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <FaCheckCircle /> Success
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 text-xs font-bold">
                          <FaTimesCircle /> Failed
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {new Date(txn.timestamp || txn.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(txn.timestamp || txn.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDownloadInvoice(txn)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-md"
                      >
                        <FaDownload /> PDF
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
