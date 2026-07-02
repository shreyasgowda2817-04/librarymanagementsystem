import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_URL } from "../config";
import { FaCheckCircle, FaTimesCircle, FaShieldAlt, FaArrowRight } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

export default function VerifyEmail() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState("verifying"); // verifying, success, error

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`, {
          method: "GET",
        });

        if (res.ok) {
          setStatus("success");
          toast.success("Email verified successfully!");
        } else {
          setStatus("error");
        }
      } catch (err) {
        setStatus("error");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#020617] p-6 font-sans relative overflow-hidden">
      <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-[20%] -right-[10%] w-[600px] h-[600px] bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-[120px]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[500px] bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-3xl rounded-xl shadow-md border border-slate-200 dark:border-slate-800 p-12 sm:p-16 text-center relative z-10"
      >
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold tracking-wider mb-4 mx-auto">
            <FaShieldAlt size={12} /> Verification Protocol
          </div>
        </div>

        {status === "verifying" && (
          <div className="space-y-6 py-10">
            <div className="w-20 h-20 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Verifying Identity...</h3>
            <p className="text-slate-500 font-medium">Please wait while we validate your credentials.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-8 py-10">
            <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
              <FaCheckCircle size={48} />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Email Verified!</h3>
              <p className="text-slate-500 font-medium">Your researcher identity has been successfully validated. You can now access the infrastructure.</p>
            </div>
            <button 
              onClick={() => nav("/login")}
              className="w-full py-5 bg-indigo-600 text-white rounded-xl text-[11px] font-bold tracking-wider hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-3"
            >
              Proceed to Login <FaArrowRight />
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-8 py-10">
            <div className="w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <FaTimesCircle size={48} />
            </div>
            <div className="space-y-4">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Verification Failed</h3>
              <p className="text-slate-500 font-medium">The verification link is invalid or has expired. Please request a new one or contact support.</p>
            </div>
            <button 
              onClick={() => nav("/")}
              className="w-full py-5 bg-slate-900 text-white rounded-xl text-[11px] font-bold tracking-wider hover:bg-slate-800 transition-all shadow-md"
            >
              Back to Home
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
