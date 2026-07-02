import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_URL } from "../config";
import { 
  FaChevronLeft, FaEnvelope, FaArrowRight, FaShieldAlt, 
  FaLock, FaCheckCircle, FaEye, FaKey 
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import OTPInput from "../components/OTPInput";
import toast from "react-hot-toast";


export default function ForgotPassword() {
  const nav = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState({ score: 0, label: "Very Weak", color: "bg-slate-200" });

  const calculateStrength = (pass) => {
    let s = 0;
    if (pass.length > 8) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;

    const levels = [
      { label: "Very Weak", color: "bg-rose-500" },
      { label: "Weak", color: "bg-orange-500" },
      { label: "Fair", color: "bg-yellow-500" },
      { label: "Good", color: "bg-blue-500" },
      { label: "Strong", color: "bg-emerald-500" }
    ];
    setStrength({ score: s, ...levels[s] });
  };

  useEffect(() => {
    calculateStrength(password);
  }, [password]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success("OTP sent to your email.");
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("OTP Verified.");
      setStep(3);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error("Passwords do not match.");
    
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Password reset successful.");
      nav("/login");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#020617] p-6 font-sans relative overflow-hidden">
      <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-50 dark:bg-blue-900/10 rounded-full blur-[120px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-3xl rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-12 sm:p-16 relative z-10"
      >
        <button 
          onClick={() => step === 1 ? nav("/login") : setStep(step - 1)} 
          className="mb-12 flex items-center gap-3 text-slate-400 hover:text-indigo-600 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all group-hover:text-white">
            <FaChevronLeft size={16} />
          </div>
          <span className="text-[10px] font-bold tracking-wider">
            {step === 1 ? "Back to Login" : "Previous Step"}
          </span>
        </button>

        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold tracking-wider mb-4">
            <FaShieldAlt size={12} /> Step {step} of 3
          </div>
          <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            {step === 1 && "Forgot Password?"}
            {step === 2 && "Verify OTP"}
            {step === 3 && "Secure Account"}
          </h3>
          <p className="text-slate-500 text-sm font-medium mt-2">
            {step === 1 && "Enter your email to receive a security code."}
            {step === 2 && `Enter the 6-digit code sent to ${email}`}
            {step === 3 && "Establish your new security passphrase."}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleSendOTP} 
              className="space-y-8"
            >
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <FaEnvelope size={16} />
                </div>
                <input
                  type="email"
                  placeholder="Enter Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl pl-16 pr-6 py-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold tracking-wider hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-3"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-800 border-t-white rounded-full animate-spin"></div> : <>Get Security Code <FaArrowRight /></>}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOTP} 
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Verification Code</span>
                <OTPInput 
                  value={otp} 
                  onChange={setOtp} 
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold tracking-wider hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-3"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-800 border-t-white rounded-full animate-spin"></div> : <>Verify Code <FaCheckCircle /></>}
              </button>
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600" onClick={handleSendOTP}>
                Resend OTP
              </p>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleResetPassword} 
              className="space-y-6"
            >
              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <FaLock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl pl-16 pr-16 py-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                >
                  <FaEye size={18} />
                </button>
              </div>

              {password && (
                <div className="space-y-2 px-2">
                   <div className="flex justify-between items-center text-sm font-semibold">
                      <span className="text-slate-400">Strength: {strength.label}</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden flex gap-1">
                      {[0,1,2,3].map(i => (
                        <div key={i} className={`h-full flex-1 transition-all duration-500 ${i < strength.score ? strength.color : 'bg-transparent'}`} />
                      ))}
                   </div>
                </div>
              )}

              <div className="relative group">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <FaLock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl pl-16 pr-6 py-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold tracking-wider hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-3"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-800 border-t-white rounded-full animate-spin"></div> : <>Update Password <FaCheckCircle /></>}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
