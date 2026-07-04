import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Book, ArrowRight, ShieldCheck, Award, Search, Sparkles,
  Layers, BrainCircuit, Activity,
  Database, Star, Users, CheckCircle2,
  Zap, Shield, Smartphone, Lock, ChevronRight, Play, Globe, Cpu
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { API_URL } from "../config";

import Footer from "../components/Footer";

const BentoCard = ({ icon: Icon, title, desc, colSpan = "col-span-1", className = "" }) => (
  <motion.div
    whileHover={{ y: -10, scale: 1.02 }}
    className={`${colSpan} ${className} bg-white dark:bg-white/5 p-6 md:p-10 rounded-xl md:rounded-xl border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-md transition-all group overflow-hidden relative`}
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-12 translate-x-12 group-hover:bg-indigo-500/10 transition-colors"></div>
    <div className="w-14 h-14 bg-indigo-50 dark:bg-white/10 rounded-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-inner">
      <Icon className="text-indigo-600 dark:text-indigo-400" size={26} />
    </div>
    <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">{title}</h3>
    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">{desc}</p>
  </motion.div>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  useEffect(() => {
    return scrollY.onChange((latest) => setIsScrolled(latest > 50));
  }, [scrollY]);

  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const plans = [
    { name: "Basic", price: "0", features: ["3 Books Limit", "15 Days Loan", "Basic Search"], col: "slate" },
    { name: "Premium", price: "299", features: ["10 Books Limit", "30 Days Loan", "AI Assistant", "Digital Archive"], col: "indigo", popular: true },
    { name: "Elite", price: "999", features: ["Unlimited Books", "No Expiry", "24/7 Support", "Rare Book Vault"], col: "purple" }
  ];

  return (
    <div className="bg-white dark:bg-[#020617] min-h-screen font-sans selection:bg-indigo-100 text-slate-900 dark:text-slate-100 transition-colors duration-500">
      <div className="noise-overlay"></div>

      {/* 💎 SAAS NAVIGATION */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 px-6 py-4 ${isScrolled ? "pt-6" : "pt-10"}`}>
        <div className={`max-w-[1400px] mx-auto flex items-center justify-between px-6 md:px-10 py-4 rounded-xl border transition-all duration-500 ${
          isScrolled 
            ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-slate-200 dark:border-slate-800 shadow-md" 
            : "bg-transparent border-transparent"
        }`}>
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md group-hover:rotate-12 transition-all">
              <Book size={20} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic leading-none hidden sm:block">LMS </span>
          </div>

          <div className="flex items-center gap-10">
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
              <a href="#features" className="hover:text-indigo-600 transition-all">Features</a>
              <a href="#pricing" className="hover:text-indigo-600 transition-all">Pricing</a>
              <a href="#workflow" className="hover:text-indigo-600 transition-all">Workflow</a>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
            >
              {user ? "Dashboard" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </nav>

      {/* 🚀 CINEMATIC HERO SECTION */}
      <section className="relative pt-40 md:pt-64 pb-20 md:pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-6">
        <motion.div style={{ opacity }} className="absolute inset-0 z-0">
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px]"></div>
        </motion.div>

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-500 font-medium tracking-wide mb-10">
             <Sparkles size={14} /> Intelligence-Driven Infrastructure
          </div>
          <h1 className="text-4xl md:text-7xl lg:text-9xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter mb-10">
            Next Gen <br />
            <span className="text-gradient-indigo">Libraries.</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto mb-16">
            An elite engine for Library research, book management, and real-time data.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button
                onClick={() => navigate(user ? "/dashboard" : "/login")}
                className="bg-indigo-600 text-white px-12 py-6 rounded-xl text-sm font-semibold tracking-wide shadow-md shadow-indigo-500/40 hover:bg-indigo-700 hover:scale-105 transition-all flex items-center justify-center gap-4"
              >
                Get Started <ArrowRight size={20} />
              </button>
              <button
                onClick={() => setIsVideoOpen(true)}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-xl text-slate-900 dark:text-white px-12 py-6 rounded-xl text-sm font-semibold tracking-wide border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-4"
              >
                <Play size={20} fill="currentColor" /> Watch Platform Demo
              </button>
          </div>
        </div>

      </section>

      {/* 📊 STATISTICS COUNTER */}
      <section className="py-20 border-y border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
          <div>
            <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">1k+</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Books Managed</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">1k+</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Active Members</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">99.9%</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Uptime</div>
          </div>
          <div>
            <div className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2">24/7</div>
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Support</div>
          </div>
        </div>
      </section>

      {/* 🔄 WORKFLOW SECTION */}
      <section id="workflow" className="py-40 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">Seamless Workflow.</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">How LMS Pro streamlines your entire operation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent z-0"></div>
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-indigo-50 dark:bg-slate-900 border-4 border-white dark:border-[#020617] rounded-full flex items-center justify-center mb-8 shadow-xl">
                <Search className="text-indigo-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">1. Smart Search</h3>
              <p className="text-slate-500">Users find exactly what they need instantly using our AI-powered natural language search.</p>
            </div>
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-purple-50 dark:bg-slate-900 border-4 border-white dark:border-[#020617] rounded-full flex items-center justify-center mb-8 shadow-xl">
                <Smartphone className="text-purple-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">2. Auto-Checkout</h3>
              <p className="text-slate-500">Self-service kiosks and mobile scanning reduce staff workload and queue times by 90%.</p>
            </div>
            
            <div className="relative z-10 text-center flex flex-col items-center">
              <div className="w-24 h-24 bg-emerald-50 dark:bg-slate-900 border-4 border-white dark:border-[#020617] rounded-full flex items-center justify-center mb-8 shadow-xl">
                <Activity className="text-emerald-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4">3. Track & Analyze</h3>
              <p className="text-slate-500">Generate stunning reports and predictive insights about your library's usage patterns.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🧩 THE BENTO EXPERIENCE */}
      <section id="features" className="py-40 px-6 bg-white dark:bg-[#020617]">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-24 text-center">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">Engineered for Scale.</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">Focus on curation, while our AI system handles the logistics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <BentoCard icon={Database} title="Smart Index" desc="Automated metadata extraction and AI-assisted categorization for global collections." colSpan="md:col-span-2" className="bg-gradient-to-br from-white to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/20" />
            <BentoCard icon={Users} title="Profile Center" desc="Manage membership lifecycles and verify credentials in real-time." />
            <BentoCard icon={Activity} title="Live Activity" desc="Real-time circulation tracking and predictive demand analytics." />
            <BentoCard icon={Lock} title="Secure DRM" desc="Military-grade encryption for protected System media and rare collections." colSpan="md:col-span-2" className="bg-gradient-to-br from-white to-purple-50/50 dark:from-slate-900 dark:to-purple-950/20" />
          </div>
        </div>
      </section>

      {/* 💬 TESTIMONIALS */}
      <section className="py-40 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#020617]">
        <div className="max-w-[1400px] mx-auto">
          <div className="mb-24 text-center">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">Trusted by Top Institutions.</h2>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">Hear what our premium partners have to say.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex text-amber-400 mb-6"><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /></div>
              <p className="text-lg font-medium mb-8">"LMS Pro entirely transformed how our university handles circulation. The AI Assistant alone saved us hundreds of hours."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-200 dark:bg-indigo-900"></div>
                <div>
                  <div className="font-bold">Shreyas</div>
                  <div className="text-sm text-slate-500">Head Librarian, India</div>
                </div>
              </div>
            </div>
            
            <div className="p-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 md:-translate-y-8">
              <div className="flex text-amber-400 mb-6"><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /></div>
              <p className="text-lg font-medium mb-8">"The UI is absolutely stunning. Our students love the mobile self-checkout feature. It's truly a next-generation product."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-200 dark:bg-purple-900"></div>
                <div>
                  <div className="font-bold">Marcus Chen</div>
                  <div className="text-sm text-slate-500">Director of IT, MIT</div>
                </div>
              </div>
            </div>

            <div className="p-10 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex text-amber-400 mb-6"><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /><Star size={20} fill="currentColor" /></div>
              <p className="text-lg font-medium mb-8">"Zero downtime during finals week. The infrastructure is rock solid and the real-time analytics give us perfect insights."</p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-200 dark:bg-emerald-900"></div>
                <div>
                  <div className="font-bold">Elena Rodriguez</div>
                  <div className="text-sm text-slate-500">Chief Archivist, Oxford</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💎 PREMIUM PRICING SECTION */}
      <section id="pricing" className="py-40 bg-slate-50 dark:bg-slate-950/50 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent"></div>
        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-6">System Tiers.</h2>
            <p className="text-xl text-slate-500 font-medium">Select the plan that fits your needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className={`p-12 rounded-xl border transition-all ${
                  plan.popular 
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-md" 
                    : "bg-white dark:bg-white/5 border-slate-200 dark:border-slate-200 dark:border-slate-800"
                } relative overflow-hidden flex flex-col`}
              >
                {plan.popular && <div className="absolute top-8 right-8 px-4 py-1.5 bg-white text-indigo-600 rounded-full text-[9px] font-semibold tracking-wide">Recommended</div>}
                <h4 className="text-2xl font-black mb-2">{plan.name}</h4>
                <div className="flex items-baseline gap-1 mb-10">
                  <span className="text-5xl font-black">₹{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? "text-indigo-200" : "text-slate-400"}`}>/sem</span>
                </div>
                <ul className="space-y-6 mb-12 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-4 text-sm font-bold">
                      <CheckCircle2 size={20} className={plan.popular ? "text-indigo-200" : "text-indigo-500"} /> {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={() => navigate("/login")}
                  className={`w-full py-5 rounded-xl text-sm font-semibold transition-all ${
                    plan.popular ? "bg-white text-indigo-600 hover:bg-slate-50" : "bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-indigo-600 hover:text-white"
                  }`}
                >
                  Subscribe Now
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 🚀 CTA SECTION */}
      <section className="py-40 px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-xl p-20 text-center relative overflow-hidden border border-slate-200 dark:border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-transparent to-purple-900/40 opacity-50"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-10 leading-none">Ready to upgrade your <br className="hidden sm:block" /> system?</h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button onClick={() => navigate("/login")} className="bg-white text-slate-900 px-12 py-6 rounded-xl text-sm font-semibold tracking-wide hover:scale-105 transition-all">Create Account</button>
              <button onClick={() => window.location.href = "mailto:shreyasgowda817@gmail.com"} className="bg-white/10 backdrop-blur-xl text-white px-12 py-6 rounded-xl text-sm font-semibold tracking-wide border border-slate-200 dark:border-slate-800 hover:bg-white/20 transition-all">Contact Support</button>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* 🎬 VIDEO MODAL */}
      <AnimatePresence>
        {isVideoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setIsVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl relative border border-slate-800"
            >
              <button 
                onClick={() => setIsVideoOpen(false)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-all"
              >
                ✕
              </button>
              <iframe 
                width="100%" 
                height="100%" 
                src="https://youtu.be/DgKHBJWYpFs?list=RDDgKHBJWYpFs" 
                title="Platform Demo" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
