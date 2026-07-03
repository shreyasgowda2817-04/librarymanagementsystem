import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { CreditCard, Zap, Lock, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

import CheckoutModal from "../components/CheckoutModal";

export default function StudentFines() {
  const [transactions, setTransactions] = useState([]);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCheckout, setShowCheckout] = useState(null);

  const fetchTransactions = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const adminCheck = user?.role === "admin";
      setIsAdmin(adminCheck);
      
      const { data } = await axios.get(`${API_URL}/api/transactions/my`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTransactions(Array.isArray(data) ? data : (data.transactions || []));
      setDues(data.filter(tx => tx.currentPenalty > 0 && !tx.finePaid));
    } catch (err) {
      toast.error("Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totalDues = dues.reduce((acc, curr) => acc + curr.currentPenalty, 0);

  const handlePayment = async (amountToPay, transactionId = "ALL") => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const authHeaders = { Authorization: `Bearer ${user.token}` };

      // Create Order
      const { data: order } = await axios.post(`${API_URL}/api/payments/create-order`, { 
        amount: amountToPay 
      }, { headers: authHeaders });

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
              await axios.post(`${API_URL}/api/payments/verify`, {
                ...response,
                amount: amountToPay,
                planName: "Fine Payment"
              }, { headers: authHeaders });

              await clearFines(transactionId, authHeaders);
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
        setShowCheckout({ amount: amountToPay, id: transactionId, order });
      }
    } catch (err) {
      toast.error("Failed to initialize payment gateway.");
    }
  };

  const clearFines = async (txIdToPay, authHeaders) => {
    if (txIdToPay === "ALL") {
      for (const tx of dues) {
        await axios.patch(`${API_URL}/api/transactions/pay-fine/${tx.id}`, {}, { headers: authHeaders });
      }
    } else {
      await axios.patch(`${API_URL}/api/transactions/pay-fine/${txIdToPay}`, {}, { headers: authHeaders });
    }
    fetchTransactions();
  };

  const handleMockPaymentSuccess = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const authHeaders = { Authorization: `Bearer ${user.token}` };
      
      const txIdToPay = showCheckout.id;
      
      // Verify mock order
      await axios.post(`${API_URL}/api/payments/verify`, {
        razorpay_order_id: showCheckout.order?.id || `mock_order_${Date.now()}`,
        isMock: true,
        planName: "Fine Payment",
        amount: showCheckout.amount
      }, { headers: authHeaders });

      await clearFines(txIdToPay, authHeaders);
      toast.success("Payment Successful!");
      setShowCheckout(null);
    } catch (err) {
      toast.error("Payment failed to verify.");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto min-h-screen">
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal 
            amount={showCheckout.amount} 
            onComplete={handleMockPaymentSuccess} 
            onClose={() => setShowCheckout(null)} 
          />
        )}
      </AnimatePresence>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Borrowing & Dues</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">View your transaction history and pay library fines.</p>
      </div>

      {/* Dues Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Outstanding</h2>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">₹{totalDues}</p>
        </div>
        {totalDues > 0 && (
          <button
            onClick={() => handlePayment(totalDues, "ALL")}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition"
          >
            Pay All Dues
          </button>
        )}
      </div>

      {/* Dues Table */}
      {dues.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pending Fines</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px] md:min-w-0">
                <thead className="bg-rose-50 dark:bg-rose-900/10 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <tr>
                    {isAdmin && <th className="px-6 py-4 font-semibold">Student</th>}
                    <th className="px-6 py-4 font-semibold">Book</th>
                    <th className="px-6 py-4 font-semibold">Due Date</th>
                    <th className="px-6 py-4 font-semibold">Fine</th>
                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dues.map((tx) => (
                    <tr key={`due-${tx.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {isAdmin && (
                        <td className="px-6 py-4 font-medium dark:text-white">
                          {tx.memberId?.name || tx.memberId?.email || "Unknown"}
                        </td>
                      )}
                      <td className="px-6 py-4 font-medium dark:text-white">{tx.bookId?.title || "Unknown Book"}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(tx.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-semibold text-rose-600">₹{tx.currentPenalty}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handlePayment(tx.currentPenalty, tx.id)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                        >
                          Pay Now
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Complete Transaction History */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Borrowing History</h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading history...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">You have no borrowing history.</div>
          ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px] md:min-w-0">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                  <tr>
                    {isAdmin && <th className="px-6 py-4 font-semibold">Student</th>}
                    <th className="px-6 py-4 font-semibold">Book</th>
                    <th className="px-6 py-4 font-semibold">Issue Date</th>
                    <th className="px-6 py-4 font-semibold">Due Date</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {isAdmin && (
                        <td className="px-6 py-4 font-medium dark:text-white">
                          {tx.memberId?.name || tx.memberId?.email || "Unknown"}
                        </td>
                      )}
                      <td className="px-6 py-4 font-medium dark:text-white">{tx.bookId?.title || "Unknown Book"}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(tx.issueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{new Date(tx.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        {tx.returned ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-full text-xs font-bold">Returned</span>
                        ) : tx.currentPenalty > 0 ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 rounded-full text-xs font-bold">Overdue</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-full text-xs font-bold">Borrowed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
