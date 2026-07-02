import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../config";
import { FaLock, FaEye, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function ResetPassword() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password");

      toast.success("Password reset successful. Please login.");
      nav("/login");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#020617] p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-rose-500 mb-4">Invalid Reset Link</h2>
          <p className="text-slate-500 mb-8">This password reset link is invalid or has expired.</p>
          <button onClick={() => nav("/login")} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#020617] p-6 font-sans relative overflow-hidden">
      <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-blue-50 dark:bg-blue-900/10 rounded-full blur-[120px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-3xl rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-12 sm:p-16 relative z-10"
      >
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold tracking-wider mb-4 mx-auto">
            <FaShieldAlt size={12} /> Security Protocol
          </div>
          <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Reset Password</h3>
          <p className="text-slate-500 text-sm font-medium mt-2">Enter your new password below.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <FaLock size={16} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl pl-16 pr-16 py-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
              required
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <FaEye size={18} />
            </button>
          </div>

          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
              <FaLock size={16} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm New Password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl pl-16 pr-6 py-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold tracking-wider hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-3 mt-4"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-800 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>Reset Password <FaArrowRight /></>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
