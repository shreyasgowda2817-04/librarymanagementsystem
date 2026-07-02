import React, { useState } from "react";
import { CreditCard, Zap, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CheckoutModal = ({ amount, onComplete, onClose }) => {
  const [step, setStep] = useState("method");
  const [form, setForm] = useState({ number: "", expiry: "", cvc: "", name: "" });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formatted = value;
    if (name === "number") formatted = value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
    if (name === "expiry") formatted = value.replace(/\D/g, "").replace(/(.{2})/, "$1/").trim().slice(0, 5);
    if (name === "cvc") formatted = value.replace(/\D/g, "").slice(0, 3);
    setForm(f => ({ ...f, [name]: formatted }));
  };

  const handleFinish = (e) => {
    e.preventDefault();
    setStep("processing");
    setTimeout(onComplete, 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Pay Fine</h2>
            <p className="text-sm text-slate-500">Amount due: ₹{amount}</p>
          </div>
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-rose-500">Cancel</button>
        </div>
        
        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === "method" && (
              <motion.div key="method" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <button onClick={() => setStep("card")} className="w-full p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 flex justify-between items-center transition">
                  <div className="flex items-center gap-4"><CreditCard className="text-indigo-600" /> <span className="font-semibold dark:text-white">Credit/Debit Card</span></div>
                  <ChevronRight className="text-slate-400" />
                </button>
                <button onClick={() => setStep("upi")} className="w-full p-6 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 flex justify-between items-center transition">
                  <div className="flex items-center gap-4"><Zap className="text-indigo-600" /> <span className="font-semibold dark:text-white">UPI Payment</span></div>
                  <ChevronRight className="text-slate-400" />
                </button>
              </motion.div>
            )}

            {step === "card" && (
              <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleFinish} className="space-y-4">
                  <input type="text" name="number" placeholder="Card Number" value={form.number} onChange={handleInputChange} required className="w-full p-4 border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl outline-none focus:border-indigo-600 dark:text-white" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" name="expiry" placeholder="MM/YY" value={form.expiry} onChange={handleInputChange} required className="w-full p-4 border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl outline-none focus:border-indigo-600 dark:text-white" />
                    <input type="text" name="cvc" placeholder="CVV" value={form.cvc} onChange={handleInputChange} required className="w-full p-4 border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl outline-none focus:border-indigo-600 dark:text-white" />
                  </div>
                  <input type="text" name="name" placeholder="Name on Card" value={form.name} onChange={handleInputChange} required className="w-full p-4 border border-slate-200 dark:border-slate-700 bg-transparent rounded-xl outline-none focus:border-indigo-600 dark:text-white" />
                  <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl mt-4 transition">Pay ₹{amount}</button>
                  <button type="button" onClick={() => setStep("method")} className="w-full text-sm text-slate-500 mt-4">Go Back</button>
                </form>
              </motion.div>
            )}

            {step === "upi" && (
              <motion.div key="upi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <div className="w-48 h-48 bg-slate-100 dark:bg-slate-800 rounded-xl mx-auto mb-6 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PAY_FINE_${amount}`} alt="QR Code" />
                </div>
                <p className="text-sm text-slate-500 mb-6">Scan QR code with any UPI app</p>
                <button onClick={handleFinish} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Simulate Payment</button>
                <button type="button" onClick={() => setStep("method")} className="block w-full text-sm text-slate-500 mt-6">Go Back</button>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <h3 className="text-xl font-bold dark:text-white mb-2">Processing Payment...</h3>
                <p className="text-slate-500">Please do not close this window.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CheckoutModal;
