import React, { useState } from "react";
import { API_URL } from "../config";
import {
  CreditCard, ShieldCheck, Zap,
  Crown, CheckCircle2, ArrowRight,
  Sparkles, Globe, Award, ChevronRight, Lock, Book
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";

const PlanCard = ({ plan, onSelect, isLoading, isAdmin }) => (
  <motion.div
    whileHover={{ y: -10, scale: 1.01 }}
    className={`p-7 rounded-xl border transition-all duration-500 relative overflow-hidden group ${plan.popular
        ? "bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white border-indigo-400/50 shadow-md"
        : plan.name === "Elite Plan"
          ? "bg-slate-900 text-white border-amber-500/30 shadow-md"
          : "bg-white dark:bg-white/5 border-slate-100 dark:border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
      }`}
  >
    {/* 💡 DYNAMIC GLOW */}
    <div className={`absolute -top-24 -right-24 w-36 h-36 bg-${plan.color}-500/20 rounded-full blur-3xl group-hover:bg-${plan.color}-500/40 transition-all duration-700`}></div>

    {plan.popular && (
      <div className="absolute top-6 right-6 px-3 py-1 bg-white text-indigo-600 rounded-full text-[8px] font-black font-medium tracking-wide shadow-md">
        High Demand
      </div>
    )}

    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:rotate-12 ${plan.popular || plan.name === "Elite Plan" ? "bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-slate-800" : "bg-indigo-50 dark:bg-white/10"
      }`}>
      {plan.icon}
    </div>

    <h3 className="text-2xl font-black mb-1.5 tracking-tighter">{plan.name}</h3>
    <div className="flex items-baseline gap-2 mb-6">
      <span className="text-4xl font-black tracking-tighter">₹{plan.price}</span>
      <span className={`text-xs font-bold uppercase tracking-widest ${plan.popular || plan.name === "Elite Plan" ? "text-white/60" : "text-slate-400"}`}>/sem</span>
    </div>

    <div className="space-y-3.5 mb-10">
      {plan.features.map((f, i) => (
        <div key={i} className="flex items-center gap-3.5 text-xs font-semibold">
          <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${plan.popular || plan.name === "Elite Plan" ? "bg-white/20" : "bg-emerald-500/10"}`}>
            <CheckCircle2 size={10} className={plan.popular || plan.name === "Elite Plan" ? "text-white" : "text-emerald-500"} />
          </div>
          <span className={plan.popular || plan.name === "Elite Plan" ? "text-white/90" : "text-slate-600 dark:text-slate-300"}>{f}</span>
        </div>
      ))}
    </div>

    <button
      onClick={() => onSelect(plan)}
      disabled={isLoading || isAdmin}
      className={`w-full py-3.5 rounded-xl text-xs font-black font-medium tracking-wide transition-all duration-300 ${
        isAdmin
          ? "bg-slate-200 text-slate-400 dark:bg-white/5 dark:text-slate-500 cursor-not-allowed border border-transparent"
          : plan.popular
            ? "bg-white text-indigo-600 hover:bg-slate-50 shadow-md"
            : plan.name === "Elite Plan"
              ? "bg-amber-500 text-white hover:bg-amber-400 shadow-md"
              : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 hover:text-white"
      } active:scale-95 disabled:opacity-50`}
    >
      {isLoading ? "Processing..." : isAdmin ? "Admin Access Enabled" : "Get Started"}
    </button>
  </motion.div>
);

const CheckoutModal = ({ plan, order, onComplete, onClose }) => {
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
    setTimeout(onComplete, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-xl shadow-md flex flex-col lg:flex-row overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        {/* 📋 LEFT: CHECKOUT FLOW */}
        <div className="flex-1 p-12 lg:p-20 relative">
          <div className="absolute top-10 left-10 flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md"><Lock size={14} /></div>
            <span className="text-sm font-semibold text-slate-400">Secure Checkout</span>
          </div>

          <div className="mt-16">
            <div className="mb-12">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4">Checkout</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Your account will be activated after payment.</p>
            </div>

            <AnimatePresence mode="wait">
              {step === "method" && (
                <motion.div key="method" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
                  <button onClick={() => setStep("card")} className="w-full p-8 rounded-xl bg-slate-50 dark:bg-white/5 border-2 border-transparent hover:border-indigo-600 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner"><CreditCard /></div>
                      <span className="font-bold text-lg">Credit or Debit Card</span>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button onClick={() => setStep("upi")} className="w-full p-8 rounded-xl bg-slate-50 dark:bg-white/5 border-2 border-transparent hover:border-indigo-600 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-indigo-600 shadow-inner"><Zap size={20} /></div>
                      <span className="font-bold text-lg">UPI Payment</span>
                    </div>
                    <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                  </button>
                </motion.div>
              )}

              {step === "card" && (
                <motion.div key="card" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <form onSubmit={handleFinish} className="space-y-6">
                    <div className="relative">
                      <input type="text" name="number" placeholder="Card Number" value={form.number} onChange={handleInputChange} required className="w-full p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-600 font-bold tracking-widest" />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex gap-2">
                        <div className="w-8 h-5 bg-slate-200 dark:bg-white/10 rounded"></div>
                        <div className="w-8 h-5 bg-slate-200 dark:bg-white/10 rounded"></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <input type="text" name="expiry" placeholder="MM/YY" value={form.expiry} onChange={handleInputChange} required className="w-full p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-600 font-bold" />
                      <input type="text" name="cvc" placeholder="CVV" value={form.cvc} onChange={handleInputChange} required className="w-full p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-600 font-bold" />
                    </div>
                    <input type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleInputChange} required className="w-full p-6 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-600 font-bold" />
                    <div className="pt-6">
                      <button type="submit" className="w-full py-6 bg-indigo-600 text-white rounded-xl font-black font-medium tracking-wide shadow-md shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95">Pay Now</button>
                      <button type="button" onClick={() => setStep("method")} className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Go Back</button>
                    </div>
                  </form>
                </motion.div>
              )}

              {step === "upi" && (
                <motion.div key="upi" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10">
                  <div className="p-10 bg-white rounded-xl border-4 border-slate-100 shadow-md inline-block">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LMS_PRO_${plan.name}`} className="w-48 h-48" alt="QR" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 mb-6">Scan with any System UPI application</p>
                    <button onClick={handleFinish} className="px-12 py-5 bg-indigo-600 text-white rounded-xl font-semibold tracking-wide shadow-md">Payment Complete</button>
                  </div>
                </motion.div>
              )}

              {step === "processing" && (
                <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center space-y-12">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="absolute inset-0 border-4 border-indigo-600/20 rounded-full"></div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full"
                    ></motion.div>
                    <div className="absolute inset-0 flex items-center justify-center text-indigo-600"><Lock size={32} /></div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-black tracking-tight mb-2">Processing Payment...</h3>
                    <p className="text-sm font-medium text-slate-400 italic">Please wait...</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 📦 RIGHT: SUMMARY PANEL */}
        <div className="w-full lg:w-96 bg-slate-50 dark:bg-slate-800/50 p-12 lg:p-16 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>

          <div className="relative z-10">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 mb-12">Order Summary</h4>
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Selected Plan</p>
                  <h5 className="text-3xl font-black tracking-tighter">{plan.name}</h5>
                </div>
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-xl flex items-center justify-center text-indigo-500 shadow-md border border-slate-200 dark:border-slate-800">{plan.icon}</div>
              </div>
              <div className="pt-8 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
                  <span>Service Fee</span>
                  <span>₹0.00</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 dark:text-white">
                  <span className="font-black text-sm uppercase tracking-widest">Total Amount</span>
                  <span className="text-4xl font-black tracking-tighter">₹{plan.price}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-12 space-y-6">
            <div className="flex items-center gap-3 text-slate-400">
              <ShieldCheck size={16} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Secure Payment</span>
            </div>
            <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-rose-500 transition-colors">Cancel</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Membership() {
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(null);
  const [billingCycle, setBillingCycle] = useState("semester"); // semester or annual
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const plans = [
    {
      name: "Basic Plan",
      price: 0,
      icon: <Globe className="text-indigo-500" size={24} />,
      features: [
        "2 Active Book Loans",
        "14-Day Max Loan Duration",
        "Standard Book Search Access",
        "No Digital PDF Vault Access",
        "Standard Email Notifications"
      ],
      popular: false,
      color: "indigo"
    },
    {
      name: "Premium Plan",
      price: billingCycle === "semester" ? 299 : 499,
      icon: <Award className="text-purple-500" size={24} />,
      features: [
        "5 Active Book Loans",
        "30-Day Max Loan Duration",
        "Full Digital PDF Vault Access",
        "Librarian AI Guide (50 queries)",
        "Priority Hold Reservations",
        "Detailed Invoicing & Receipts",
        "Custom Accent Configurations"
      ],
      popular: true,
      color: "purple"
    },
    {
      name: "Elite Plan",
      price: billingCycle === "semester" ? 999 : 1499,
      icon: <Crown className="text-amber-500" size={24} />,
      features: [
        "15 Active Book Loans",
        "Exempt from Late Fees (No Overdue Fines)",
        "Unlimited Librarian AI Assistant",
        "Exclusive Rare Book Vault Access",
        "Multi-Session Security Tracking",
        "Advanced API Keys Generation",
        "24/7 Priority Support Desk"
      ],
      popular: false,
      color: "amber"
    }
  ];


  const handlePayment = async (plan) => {
    const currentMembership = user?.membership || "Basic";
    const tierName = plan.name.split(" ")[0]; // e.g. "Premium" or "Elite"

    if (plan.price === 0 || currentMembership === "Basic" && plan.price === 0) {
      toast.success("Basic plan is already active!");
      return;
    }

    if (currentMembership === tierName) {
      toast.error(`You already have the ${plan.name} active!`);
      return;
    }

    if (currentMembership === "Elite" && tierName === "Premium") {
      toast.error("You already have the Elite Plan, which includes all Premium features!");
      return;
    }

    setIsLoading(true);
    try {
      const { data: order } = await axios.post(`${API_URL}/api/payments/create-order`, {
        amount: plan.price,
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });

      if (order.key_id && order.key_id !== "rzp_test_placeholder") {
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: "LMS Pro Library",
          description: `Membership Upgrade: ${plan.name}`,
          order_id: order.id,
          handler: async (response) => {
            try {
              const { data: verifyData } = await axios.post(`${API_URL}/api/payments/verify`, {
                ...response,
                amount: plan.price,
                planName: plan.name
              }, {
                headers: { Authorization: `Bearer ${user?.token}` }
              });
              toast.success(verifyData.message, { icon: "👑" });

              const tierName = plan.name.split(" ")[0];
              const newLimits = { 
                maxBooks: tierName === "Elite" ? 999 : tierName === "Premium" ? 10 : 3,
                digitalAccess: tierName === "Elite" || tierName === "Premium" ? true : false,
                aiAnalysisAccess: tierName === "Elite" || tierName === "Premium" ? true : false,
                label: tierName
              };
              const updatedUser = { ...user, membership: tierName, limits: newLimits };
              localStorage.setItem("user", JSON.stringify(updatedUser));

              setTimeout(() => window.location.href = "/dashboard", 2000);
            } catch (err) {
              toast.error("Signature verification failed.");
            }
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#4f46e5" }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setShowCheckout({ plan, order });
      }

    } catch (error) {
      console.error("Payment Error:", error);
      const errorMsg = error.response?.data?.error || "System Connection Lost. Retrying...";
      toast.error(errorMsg, { icon: "📡" });

      // Fallback to simulator even on connection error for dev stability
      if (process.env.NODE_ENV === "development") {
        console.log("🛠️ Dev Mode: Launching Simulated Checkout due to connection error.");
        setShowCheckout({
          plan,
          order: { id: `err_mock_${Date.now()}`, key_id: "rzp_test_placeholder" }
        });
      }
      setIsLoading(false);
    }
  };

  const handleMockComplete = async () => {
    try {
      const { data: verifyData } = await axios.post(`${API_URL}/api/payments/verify`, {
        razorpay_order_id: showCheckout.order.id,
        isMock: true,
        amount: showCheckout.plan.price,
        planName: showCheckout.plan.name
      }, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success(verifyData.message, { icon: "👑" });

      const tierName = showCheckout.plan.name.split(" ")[0];
      const newLimits = { 
        maxBooks: tierName === "Elite" ? 999 : tierName === "Premium" ? 10 : 3,
        digitalAccess: tierName === "Elite" || tierName === "Premium" ? true : false,
        aiAnalysisAccess: tierName === "Elite" || tierName === "Premium" ? true : false,
        label: tierName
      };
      const updatedUser = { ...user, membership: tierName, limits: newLimits };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setTimeout(() => window.location.href = "/dashboard", 1500);
    } catch (err) {
      toast.error("Verification failed.");
    } finally {
      setShowCheckout(null);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-[#020617] transition-colors duration-500 overflow-hidden">

      {/* 🌌 IMMERSIVE NEURAL BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#4f46e522,transparent)]"></div>
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-indigo-600/10 rounded-full blur-[120px]"
        ></motion.div>
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: [0.05, 0.15, 0.05]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-purple-600/10 rounded-full blur-[120px]"
        ></motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <AnimatePresence>
          {showCheckout && <CheckoutModal plan={showCheckout.plan} order={showCheckout.order} onComplete={handleMockComplete} onClose={() => { setShowCheckout(null); setIsLoading(false); }} />}
        </AnimatePresence>

        {user?.role === "admin" && (
          <div className="mb-12 p-6 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20 text-center font-bold text-sm max-w-3xl mx-auto shadow-sm">
            <span className="inline-block mr-2 text-base">⚠️</span> 
            You are logged in as an Administrator. You hold absolute privileges across all catalog modules. Subscription checkouts are only applicable to student accounts.
          </div>
        )}

        <div className="mb-24 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-indigo-600/10 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-10 border border-indigo-600/20 backdrop-blur-xl"
          >
            <Sparkles size={14} className="animate-pulse" /> Membership Plans
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-8xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.9]"
          >
            Upgrade Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-500 to-amber-500">Experience</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-xl font-medium leading-relaxed mb-12"
          >
            Choose a plan to unlock advanced features and premium library access.
          </motion.p>

          {/* 🔘 BILLING TOGGLE */}
          <div className="flex items-center justify-center gap-6 mb-20">
            <span className={`text-sm font-semibold tracking-wide ${billingCycle === 'semester' ? 'text-indigo-600' : 'text-slate-400'}`}>Semester</span>
            <button
              onClick={() => setBillingCycle(c => c === 'semester' ? 'annual' : 'semester')}
              className="w-16 h-8 bg-slate-100 dark:bg-white/10 rounded-full p-1 relative transition-colors group border border-slate-200 dark:border-slate-200 dark:border-slate-800"
            >
              <motion.div
                animate={{ x: billingCycle === 'semester' ? 0 : 32 }}
                className="w-6 h-6 bg-indigo-600 rounded-full shadow-md"
              ></motion.div>
            </button>
            <span className={`text-sm font-semibold tracking-wide ${billingCycle === 'annual' ? 'text-indigo-600' : 'text-slate-400'}`}>Annual <span className="ml-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px]">Save 20%</span></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-32">
          {plans.map((plan, i) => (
            <PlanCard key={i} plan={plan} onSelect={handlePayment} isLoading={isLoading} isAdmin={user?.role === "admin"} />
          ))}
        </div>

        {/* 🏆 ELITE FEATURE BENTO GRID */}
        <div className="mb-24 space-y-10">
          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tighter mb-2">Premium Features</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Available in premium plans</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { t: "Rare Archives", d: "Access digitized 17th-century manuscripts", i: <Lock size={16} />, col: "indigo" },
              { t: "AI Search", d: "AI-powered semantic cross-referencing", i: <Zap size={16} />, col: "purple" },
              { t: "Priority Requests", d: "Zero wait-time on all book requests", i: <Sparkles size={16} />, col: "amber" },
              { t: "Account Security", d: "Enhanced biometric login protocols", i: <ShieldCheck size={16} />, col: "emerald" }
            ].map((f, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-5 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md group hover:border-indigo-500/30 transition-all"
              >
                <div className={`w-10 h-10 bg-${f.col}-500/10 text-${f.col}-500 rounded-xl flex items-center justify-center mb-4 shadow-inner`}>{f.i}</div>
                <h4 className="text-base font-black tracking-tight mb-1.5">{f.t}</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{f.d}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 🔐 TRUST ECOSYSTEM */}
        <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-1000">
          <div className="flex items-center gap-3 font-black text-[9px] uppercase tracking-[0.4em]"><ShieldCheck size={16} className="text-indigo-600" /> Secure Payment</div>
          <div className="flex items-center gap-3 font-black text-[9px] uppercase tracking-[0.4em]"><Zap size={16} className="text-purple-600" /> Instant Access</div>
          <div className="flex items-center gap-3 font-black text-[9px] uppercase tracking-[0.4em]"><Award size={16} className="text-amber-600" /> Trusted Payments</div>
        </div>
      </div>
    </div>
  );
}
