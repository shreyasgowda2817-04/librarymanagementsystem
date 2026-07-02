import React, { useState, useRef, useEffect } from "react";
import { API_URL } from "../config";
import { 
  Send, Sparkles, Bot, User, RotateCcw, 
  Copy, Check, Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import toast from "react-hot-toast";

export default function EmbeddedAI() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("embedded_ai_history");
    return saved ? JSON.parse(saved) : [
      { role: "assistant", content: "### Welcome back, Student!\nI'm your **LMS Smart Assistant**. I can help you find books, summarize topics, or generate study quizzes. What are we learning today?" }
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("embedded_ai_history", JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).token : "";
      const response = await axios.post(`${API_URL}/api/ai/chat`, {
        message: input,
        history: messages.slice(-4)
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });


      setMessages(prev => [...prev, { role: "assistant", content: response.data.reply }]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage = error.response?.data?.reply || "The system is busy right now. Please try again in a minute.";
      setMessages(prev => [...prev, { role: "assistant", content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    toast.success("Copied!");
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md flex flex-col h-[600px] overflow-hidden relative group">
      {/* Header */}
      <div className="p-8 bg-indigo-600 text-white flex items-center justify-between relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-md">
            <Cpu size={24} className={isLoading ? "animate-spin" : "animate-pulse"} />
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">AI Study Companion</h3>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-100 opacity-80">
               Live Academic Engine
            </div>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ role: "assistant", content: "History cleared. How can I assist you?" }])} 
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all relative z-10"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-[#020617]/20"
      >
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-md ${
              msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-indigo-600 text-white"
            }`}>
              {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={`max-w-[85%] group relative`}>
              <div className={`p-5 rounded-xl text-sm font-medium leading-relaxed prose prose-sm dark:prose-invert max-w-none ${
                msg.role === "user" 
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-indigo-500/10" 
                  : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-800 shadow-md"
              }`}>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '')
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={atomDark}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-xl my-4 text-[11px]"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded font-mono text-indigo-500" {...props}>
                          {children}
                        </code>
                      )
                    }
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
              {msg.role === "assistant" && (
                <button 
                  onClick={() => copyToClipboard(msg.content)} 
                  className="absolute top-2 -right-10 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 shadow-md"
                >
                  {copySuccess ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center animate-pulse">
              <Bot size={20} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-xl rounded-tl-none shadow-md flex gap-2 items-center border border-slate-200 dark:border-slate-800">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></motion.div>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></motion.div>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></motion.div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 p-3 pr-3 rounded-xl border border-transparent focus-within:border-indigo-500/50 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask for research help or book summaries..."
            className="flex-1 bg-transparent border-none outline-none px-4 text-sm font-medium dark:text-white"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-md shadow-indigo-500/20"
          >
            <Send size={20} />
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 px-2">
           <Sparkles size={12} className="text-indigo-500" />
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
             Integrated Smart Assistant
           </span>
        </div>
      </div>
    </div>
  );
}
