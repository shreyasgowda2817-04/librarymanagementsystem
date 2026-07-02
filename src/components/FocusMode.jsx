import React, { useState, useEffect } from "react";
import { FaPlay, FaPause, FaRedo, FaTimes, FaClock, FaBrain, FaCoffee, FaMusic, FaCheckCircle, FaFire, FaRegLightbulb, FaMagic, FaChevronRight, FaRobot } from "react-icons/fa";
import toast from "react-hot-toast";

const FocusMode = ({ onClose }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState("work"); 
  const [task, setTask] = useState("");
  const [todayFocus, setTodayFocus] = useState(145); 
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [aiInsight, setAiInsight] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const totalTime = mode === "work" ? 25 * 60 : 5 * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
      handleSessionEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionEnd = () => {
    setIsActive(false);
    if (soundEnabled) {
      const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
      audio.play().catch(() => {});
    }
    
    if (mode === "work") {
      toast.success("Session Complete! Session sync finished.", { 
        duration: 4000,
        style: { borderRadius: '16px', background: '#0f172a', color: '#fff' }
      });
      setTodayFocus(prev => prev + 25);
      setMode("break");
      setTimeLeft(5 * 60);
    } else {
      toast.success("Break Over", { icon: "☀️" });
      setMode("work");
      setTimeLeft(25 * 60);
    }
  };

  const handleAiPlan = (e) => {
    if (e.key === 'Enter' && task.trim()) {
      setIsAiLoading(true);
      setAiInsight(null);
      
      // Simulated Gemini AI Call
      setTimeout(() => {
        const insights = [
          `Gemini Suggestion: Break down "${task}" into three 15-minute sprints for maximum retention.`,
          `AI Insight: For "${task}", research suggests using the Feynman Technique during this session.`,
          `Deep Work Protocol: I've optimized a flow state for "${task}". Focus on core concepts first.`,
          `Gemini Analytics: This task is complex. I recommend enabling Lo-Fi background audio.`
        ];
        setAiInsight(insights[Math.floor(Math.random() * insights.length)]);
        setIsAiLoading(false);
        toast.success("Gemini has generated a focus plan!", { icon: "✨" });
      }, 1500);
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => { setIsActive(false); setTimeLeft(totalTime); };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/40 backdrop-blur-[60px] animate-fadeIn">
      
      {/* AI Aura Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[150px] opacity-20 bg-blue-600 transition-all duration-1000`}></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] animate-pulse"></div>
      </div>

      <div className="bg-slate-900/90 dark:bg-[#0f172a]/95 backdrop-blur-3xl w-full max-w-xl rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden relative animate-proPop">
        
        {/* Header with AI Badge */}
        <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600/10 to-transparent">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
                <FaRobot size={22} />
              </div>
              <div>
                 <h2 className="text-white font-black text-lg tracking-tight leading-none">Focus Engine</h2>
                 <p className="text-[9px] text-blue-400 font-black font-medium tracking-wide mt-2 flex items-center gap-2">
                   <FaMagic size={10} className="animate-pulse" /> Gemini AI Integrated
                 </p>
              </div>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 transition-all">
             <FaTimes size={18} />
           </button>
        </div>

        <div className="p-10 flex flex-col items-center">
          
          {/* Timer */}
          <div className="relative mb-12">
             <div className="text-[7rem] font-black text-white tabular-nums tracking-tighter leading-none select-none">
                {formatTime(timeLeft)}
             </div>
             <div className="flex gap-1.5 mt-4 justify-center">
                <span className={`w-1.5 h-1.5 rounded-full bg-blue-500 ${isActive ? 'animate-bounce' : 'opacity-20'}`}></span>
                <span className={`w-1.5 h-1.5 rounded-full bg-blue-500 ${isActive ? 'animate-bounce [animation-delay:0.2s]' : 'opacity-20'}`}></span>
                <span className={`w-1.5 h-1.5 rounded-full bg-blue-500 ${isActive ? 'animate-bounce [animation-delay:0.4s]' : 'opacity-20'}`}></span>
             </div>
          </div>

          {/* AI Focus Bar */}
          <div className="w-full mb-8 relative group">
             <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition duration-500"></div>
             <div className="relative flex items-center gap-4 bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4">
                <FaMagic className={isAiLoading ? "text-blue-400 animate-spin" : "text-blue-500"} />
                <input 
                  type="text" 
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  onKeyDown={handleAiPlan}
                  placeholder="Ask Gemini to plan your focus task..."
                  className="flex-1 bg-transparent border-none text-sm font-bold text-white outline-none placeholder:text-white/20"
                />
                <kbd className="hidden sm:block px-2 py-1 bg-white/5 rounded text-[10px] text-white/40 font-black tracking-widest border border-slate-200 dark:border-slate-800">ENTER</kbd>
             </div>
          </div>

          {/* AI Insight Box */}
          {(aiInsight || isAiLoading) && (
            <div className="w-full mb-10 p-5 bg-blue-600/10 border border-blue-500/20 rounded-xl animate-fadeIn">
               <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 shrink-0">
                     <FaRobot size={14} />
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">AI Intelligence</h4>
                     {isAiLoading ? (
                        <div className="space-y-2 mt-2">
                           <div className="h-2 w-32 bg-blue-400/20 rounded-full animate-pulse"></div>
                           <div className="h-2 w-48 bg-blue-400/10 rounded-full animate-pulse delay-75"></div>
                        </div>
                     ) : (
                        <p className="text-xs text-blue-100/80 leading-relaxed font-medium">
                           {aiInsight}
                        </p>
                     )}
                  </div>
               </div>
            </div>
          )}

          {/* Elite Controls */}
          <div className="flex items-center gap-10 mb-10">
            <button onClick={resetTimer} className="w-14 h-14 rounded-xl bg-white/5 text-white/40 hover:text-blue-500 transition-all flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-md">
               <FaRedo size={18} />
            </button>
            
            <button 
              onClick={toggleTimer}
              className={`w-24 h-24 rounded-xl flex items-center justify-center text-white shadow-md transition-all transform active:scale-90 ${isActive ? 'bg-white text-slate-900' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isActive ? <FaPause size={32} /> : <FaPlay size={32} className="ml-1" />}
            </button>

            <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-all ${soundEnabled ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-slate-200 dark:border-slate-800 text-white/20'}`}>
               <FaMusic size={18} />
            </button>
          </div>

          {/* Mode Selector */}
          <div className="w-full flex p-1.5 bg-black/20 rounded-xl border border-slate-200 dark:border-slate-800">
             <button 
               onClick={() => { setMode("work"); setTimeLeft(25 * 60); setIsActive(false); }}
               className={`flex-1 py-4 text-sm font-semibold rounded-xl transition-all ${mode === 'work' ? 'bg-white text-blue-600 shadow-md' : 'text-white/40 hover:text-white'}`}
             >
               Hyper Focus
             </button>
             <button 
               onClick={() => { setMode("break"); setTimeLeft(5 * 60); setIsActive(false); }}
               className={`flex-1 py-4 text-sm font-semibold rounded-xl transition-all ${mode === 'break' ? 'bg-white text-emerald-600 shadow-md' : 'text-white/40 hover:text-white'}`}
             >
               Break Time
             </button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="px-10 py-6 bg-black/40 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
           <div className="flex items-center gap-2">
              <FaFire className="text-orange-500" size={12} />
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">{todayFocus}m Focused Today</p>
           </div>
           <p className="text-[9px] text-white/30 font-black font-medium tracking-wide">Quantum Core v4.3</p>
        </div>
      </div>
    </div>
  );
};

export default FocusMode;
