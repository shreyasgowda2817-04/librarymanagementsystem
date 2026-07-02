import React from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle, FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import { motion } from "framer-motion";

export default function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-900/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center relative z-10"
      >
        <div className="w-20 h-20 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center justify-center mx-auto mb-8 text-rose-500">
          <FaShieldAlt size={40} />
        </div>

        <h1 className="text-3xl font-black text-white mb-4 tracking-tight">Access Denied.</h1>
        <p className="text-slate-400 font-medium mb-10 leading-relaxed">
          The requested resource is restricted to authorized personnel. Your current node level is insufficient to access this encrypted directory.
        </p>

        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate("/dashboard")}
            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-3"
          >
            <FaArrowLeft /> Return to Safe Zone
          </button>
          
          <p className="text-[10px] font-black text-rose-500/50 font-medium tracking-wide mt-4">
            Security Violation Logged
          </p>
        </div>
      </motion.div>
    </div>
  );
}
