import { API_URL } from "../config";
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { 
    FaChevronLeft, 
    FaQuestionCircle, 
    FaCheckCircle, 
    FaBrain, 
    FaLightbulb 
} from "react-icons/fa";

export default function ModuleQuestions() {
    const { moduleName } = useParams();
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuestions();
    }, [moduleName]);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`${API_URL}/api/modules/${moduleName}/questions`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setQuestions(Array.isArray(data) ? data : []);
        } catch (err) {
            toast.error(err.message || "Failed to load questions");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#020617] min-h-screen text-slate-900 dark:text-slate-100 pb-20 font-sans transition-colors duration-500">
            {/* ELITE HEADER */}
            <div className="relative h-[280px] bg-slate-900 flex items-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-950 to-indigo-950 opacity-80"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                
                {/* Animated Orbs */}
                <div className="absolute top-10 right-20 w-64 h-64 bg-teal-600/20 rounded-full blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-10 right-60 w-48 h-48 bg-indigo-600/20 rounded-full blur-[80px]"></div>

                <div className="max-w-[1200px] mx-auto px-6 sm:px-10 relative z-10 w-full">
                    <Link
                        to="/admin-dashboard"
                        className="inline-flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-white transition-colors mb-6 bg-white/5 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full backdrop-blur-sm"
                    >
                        <FaChevronLeft /> Return to Dashboard
                    </Link>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-12 h-12 rounded-xl bg-white/10 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-teal-400 shadow-md backdrop-blur-md">
                                    <FaBrain size={24} />
                                </div>
                                <span className="text-xs font-bold text-teal-400 tracking-widest uppercase bg-teal-400/10 px-3 py-1 rounded-full border border-teal-400/20">
                                    Knowledge Base
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">
                                {moduleName}
                            </h1>
                            <p className="text-slate-400 text-lg font-medium mt-4 max-w-xl">
                                Review all registered questions and correct answers for this learning module.
                            </p>
                        </div>
                        
                        <div className="bg-white/5 backdrop-blur-md border border-slate-200 dark:border-slate-800 px-8 py-6 rounded-xl text-center shadow-md">
                            <h3 className="text-4xl font-black text-white">{loading ? "-" : questions.length}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Total Questions</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1200px] mx-auto px-6 sm:px-10 -mt-12 relative z-20">
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-40 bg-slate-100 dark:bg-[#1e293b] rounded-xl animate-pulse border border-slate-200 dark:border-slate-200 dark:border-slate-800"></div>
                        ))}
                    </div>
                ) : questions.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-[#1e293b] rounded-xl p-16 text-center border border-slate-200 dark:border-slate-800 shadow-md"
                    >
                        <div className="w-24 h-24 bg-slate-50 dark:bg-[#0f172a] rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400 shadow-inner">
                            <FaQuestionCircle size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No questions found</h3>
                        <p className="text-slate-500 font-medium max-w-md mx-auto">
                            It looks like there are no questions configured for this module yet.
                        </p>
                    </motion.div>
                ) : (
                    <div className="space-y-6">
                        {questions.map((q, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={q._id || idx}
                                className="bg-white dark:bg-[#1e293b] p-8 sm:p-10 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-teal-500/30 transition-all duration-300 group relative overflow-hidden"
                            >
                                {/* Subtle Hover Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
                                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-200 dark:border-slate-800 flex items-center justify-center text-teal-500 font-bold text-xl shadow-inner group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                                        Q{idx + 1}
                                    </div>
                                    
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <FaLightbulb className="text-amber-500" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Prompt</span>
                                            </div>
                                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed">
                                                {q.question}
                                            </h3>
                                        </div>

                                        <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-6 border border-emerald-100 dark:border-emerald-900/30">
                                            <div className="flex items-center gap-2 mb-2">
                                                <FaCheckCircle className="text-emerald-600 dark:text-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-500 uppercase tracking-widest">Correct Answer</span>
                                            </div>
                                            <p className="text-emerald-900 dark:text-emerald-100 font-medium text-lg">
                                                {q.correctAnswer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
    