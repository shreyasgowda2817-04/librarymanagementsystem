import React, { useState, useEffect } from "react";
import { FaBrain, FaRobot } from "react-icons/fa";
import { Sparkles } from "lucide-react";
import { API_URL } from "../config";

import { motion, AnimatePresence } from "framer-motion";

export default function DashboardAI() {
  const [isOpening, setIsOpening] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [isLoadingInsight, setIsLoadingInsight] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const res = await fetch(`${API_URL}/api/ai/dashboard-summary`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        const data = await res.json();
        if (data.insight) {
          setAiInsight(data.insight);
        } else {
          setAiInsight("Database analysis complete. Systems are functioning normally.");
        }
      } catch (err) {
        setAiInsight("I'm currently offline and unable to analyze the database.");
      } finally {
        setIsLoadingInsight(false);
      }
    };
    fetchInsight();
  }, []);

  const handleLaunch = () => {
    setIsOpening(true);
    if (window.openAIAssistant) {
      window.openAIAssistant();
    } else {
      window.dispatchEvent(new CustomEvent("triggerAIAssistant"));
    }
    setTimeout(() => setIsOpening(false), 2000);
  };

  return (
    <div className="bg-slate-900 rounded-xl p-10 text-white relative overflow-hidden shadow-md border border-slate-800 group h-full flex flex-col justify-between">
      {/* Dynamic Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-indigo-600/30 transition-all duration-700"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              <FaRobot size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight uppercase tracking-widest text-[10px] text-indigo-400 mb-1">Infrastructure AI</h3>
              <h4 className="text-2xl font-black">Neural Assistant</h4>
            </div>
          </div>
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse [animation-delay:0.2s]"></span>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <div className="p-4 bg-white/5 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors relative min-h-[100px]">
            {isLoadingInsight ? (
              <div className="flex flex-col gap-2 animate-pulse">
                <div className="h-4 bg-slate-700/50 rounded w-full"></div>
                <div className="h-4 bg-slate-700/50 rounded w-5/6"></div>
                <div className="h-4 bg-slate-700/50 rounded w-4/6"></div>
              </div>
            ) : (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-slate-300 leading-relaxed font-medium"
              >
                "{aiInsight}"
              </motion.p>
            )}
          </div>
          <div className="p-4 bg-indigo-600/10 rounded-xl border border-indigo-500/20">
            <p className="text-sm text-indigo-300 leading-relaxed font-bold">
              Ready to execute automated actions?
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleLaunch}
        className="relative z-10 w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-[0.3em] hover:shadow-md hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 group overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {isOpening ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <div className="w-4 h-4 border-2 border-slate-200 dark:border-slate-800 border-t-white rounded-full animate-spin"></div>
              <span>Connecting...</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-4"
            >
              <FaBrain size={18} className="group-hover:rotate-5 transition-transform" />
              <span>Ask AI intelligence</span>
              <Sparkles size={14} className="text-indigo-300 animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Decorative Glow */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
    </div>
  );
}
