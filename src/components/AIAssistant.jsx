import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../config";
import {
  Send, X, Sparkles, Bot, User,
  RotateCcw, RefreshCw, Clock, ExternalLink,
  Copy, Check, MessageSquarePlus, Zap,
  Maximize2, Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("ai_chat_history");
    return saved ? JSON.parse(saved) : [
      { role: "assistant", content: "Hello! I'm your Library Zoiee. How can I help you today?", timestamp: new Date().toISOString() }
    ];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [allHistories, setAllHistories] = useState(() => {
    const saved = localStorage.getItem("ai_all_histories");
    return saved ? JSON.parse(saved) : [];
  });
  const scrollRef = useRef(null);

  const quickActions = [
    { label: "Summarize catalog", icon: <MessageSquarePlus size={14} /> },
    { label: "Recommend books", icon: <Zap size={14} /> },
    { label: "Research plan", icon: <Clock size={14} /> }
  ];

  useEffect(() => { 
    console.log("AI Assistant isOpen state changed:", isOpen);
  }, [isOpen]);

  useEffect(() => {
    const handleToggle = () => {
      console.log("AI Assistant Triggered via Event");
      setIsOpen(true);
    };

    // Attach to window for direct access
    window.openAIAssistant = () => {
      console.log("AI Assistant opened via window.openAIAssistant");
      setIsOpen(true);
    };

    window.addEventListener('toggleAIAssistant', handleToggle);
    window.addEventListener('triggerAIAssistant', handleToggle);
    return () => {
      window.removeEventListener('toggleAIAssistant', handleToggle);
      window.removeEventListener('triggerAIAssistant', handleToggle);
      delete window.openAIAssistant;
    };
  }, []);




  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = user.id || user._id || user.email;

  useEffect(() => {
    const savedUserId = localStorage.getItem("ai_chat_user_id");
    if (userId && savedUserId && userId !== savedUserId) {
      // User has shifted - clear history for privacy
      localStorage.removeItem("ai_chat_history");
      setMessages([
        { role: "assistant", content: `Hello ${user.name || 'there'}! I'm your Library Zoiee. How can I help you today?`, timestamp: new Date().toISOString() }
      ]);
    }
    if (userId) {
      localStorage.setItem("ai_chat_user_id", userId);
    }
  }, [userId]);

  useEffect(() => {
    localStorage.setItem("ai_chat_history", JSON.stringify(messages));
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages, isOpen]);

  const handleSend = async (customMsg) => {
    const textToSend = customMsg || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = { role: "user", content: textToSend, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")).token : "";
      
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-4)
        })
      });

      if (!response.ok) throw new Error("API Connection failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      // Add empty assistant message that will be typed out
      setMessages(prev => [...prev, { role: "assistant", content: "", timestamp: new Date().toISOString() }]);
      setIsLoading(false); // Disable loading animation once stream starts

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // Keep the last incomplete line in the buffer
        
        for (const line of lines) {
           if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "");
              try {
                const data = JSON.parse(dataStr);
                
                if (data.error) {
                  setMessages(prev => {
                     const newMessages = [...prev];
                     newMessages[newMessages.length - 1] = {
                       ...newMessages[newMessages.length - 1],
                       content: data.text
                     };
                     return newMessages;
                  });
                  break;
                }

                const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                if (textChunk) {
                  setMessages(prev => {
                     const newMessages = [...prev];
                     const lastIndex = newMessages.length - 1;
                     newMessages[lastIndex] = {
                       ...newMessages[lastIndex],
                       content: newMessages[lastIndex].content + textChunk
                     };
                     return newMessages;
                  });
                }
              } catch(e) {
                // Ignore incomplete JSON chunks, they will be parsed when complete
              }
           }
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue. Please try again shortly.", timestamp: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success("Response copied to clipboard");
  };


  const saveToAllHistories = () => {
    if (messages.length > 1) {
      // Check if this chat is already saved (by matching the first user message)
      // For simplicity, we just save it as a new session if it has user messages
      const titleMsg = messages.find(m => m.role === "user");
      if (titleMsg) {
        const newHistoryItem = {
          id: Date.now(),
          title: titleMsg.content.substring(0, 30) + "...",
          date: new Date().toISOString(),
          messages: [...messages]
        };
        const updated = [newHistoryItem, ...allHistories];
        setAllHistories(updated);
        localStorage.setItem("ai_all_histories", JSON.stringify(updated));
      }
    }
  };

  const startNewChat = () => {
    saveToAllHistories();
    const initialMsg = [
      { role: "assistant", content: "Starting a new conversation. How can I help?", timestamp: new Date().toISOString() }
    ];
    setMessages(initialMsg);
    localStorage.removeItem("ai_chat_history");
    toast.success("New Chat Started");
  };

  const handleClose = () => {
    saveToAllHistories();
    setIsOpen(false);
    const initialMsg = [
      { role: "assistant", content: "Hello! I'm your Library Assistant. How can I help you today?", timestamp: new Date().toISOString() }
    ];
    setMessages(initialMsg);
    localStorage.removeItem("ai_chat_history");
  };

  const loadHistory = (historyItem) => {
    saveToAllHistories(); // Save current before loading
    setMessages(historyItem.messages);
    localStorage.setItem("ai_chat_history", JSON.stringify(historyItem.messages));
    if (window.innerWidth < 768) setShowHistory(false); // hide on mobile after selection
  };

  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to delete all chat history?")) {
      setAllHistories([]);
      localStorage.removeItem("ai_all_histories");
    }
  };


  const startFocusMode = () => {
    window.dispatchEvent(new CustomEvent('openFocusMode'));
    setIsOpen(false);
    toast.success("Focus Mode Initiated");
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[10000] font-sans pointer-events-auto">

      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-indigo-600 rounded-xl shadow-md shadow-indigo-500/20 flex items-center justify-center text-white relative group border border-slate-200 dark:border-slate-800"
          >
            <Bot size={28} />
            <div className="absolute top-2 right-2">
              <span className="w-2 h-2 bg-emerald-400 rounded-full shadow-md"></span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              width: isMaximized ? "min(1200px, 90vw)" : "min(400px, 95vw)",
              height: isMaximized ? "85vh" : "min(600px, 80vh)",
              right: isMaximized ? "50%" : "0px",
              translateX: isMaximized ? "50%" : "0%",
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative transition-all duration-500 ease-in-out"
            style={{ 
              position: isMaximized ? 'fixed' : 'absolute',
              bottom: isMaximized ? '7.5vh' : '0px',
            }}
          >

            {/* HEADER */}
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowHistory(!showHistory)} title="History" className={`p-2 rounded-xl transition-all ${showHistory ? 'bg-white/20' : 'hover:bg-white/10'}`}>
                  <Clock size={18} />
                </button>
                <button onClick={startNewChat} title="New Chat" className="p-2 hover:bg-white/10 rounded-xl transition-all"><MessageSquarePlus size={18} /></button>
                <button onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? "Restore" : "Maximize"} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  {isMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button onClick={handleClose} title="Close" className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={18} /></button>
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex flex-1 overflow-hidden relative">
              
              {/* HISTORY SIDEBAR */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 260, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-20 absolute h-full md:relative shrink-0 shadow-md md:shadow-none"
                  >
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white">Chat History</h4>
                      <button onClick={clearAllHistory} title="Clear All" className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors">
                        <RotateCcw size={14} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                      {allHistories.length === 0 ? (
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center p-4">No past conversations</p>
                      ) : (
                        allHistories.map(h => (
                          <button 
                            key={h.id} 
                            onClick={() => loadHistory(h)} 
                            className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl text-sm text-slate-700 dark:text-slate-300 transition-colors border border-transparent hover:border-indigo-100 dark:hover:border-indigo-500/20 group"
                          >
                            <div className="font-medium truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{h.title}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                              {new Date(h.date).toLocaleDateString()} {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CHAT AREA */}
              <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 relative">
                {/* CHAT CANVAS */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar relative z-10 text-[15px]">
                  {messages.map((msg, i) => (
                    msg.role === "user" ? (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className="flex justify-end w-full">
                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 px-5 py-3 rounded-xl max-w-[85%] md:max-w-[75%] leading-relaxed shadow-md">
                          {msg.content}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className="flex justify-start w-full group">
                        <div className="flex gap-3 md:gap-4 w-full">
                          <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 bg-white dark:bg-slate-800 shadow-md">
                            <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5 relative">
                            <div className="prose prose-sm dark:prose-invert max-w-none break-words text-slate-800 dark:text-slate-200">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                              <button
                                onClick={() => copyToClipboard(msg.content, i)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              >
                                {copiedIndex === i ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  ))}
                  {isLoading && (
                    <div className="flex justify-start w-full">
                      <div className="flex gap-3 md:gap-4 w-full">
                        <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 bg-white dark:bg-slate-800 shadow-md animate-pulse">
                          <Sparkles size={16} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0 pt-3">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* INPUT AREA */}
                <div className="p-4 md:p-8 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-200 dark:border-slate-800 relative z-10 shrink-0">
                  {/* QUICK CHIPS */}
                  {!isLoading && messages.length < 3 && (
                    <div className="flex flex-nowrap overflow-x-auto gap-2 mb-4 md:mb-6 pb-2 custom-scrollbar hide-scrollbar">
                      {quickActions.map((action, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(action.label)}
                          className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-full text-[11px] md:text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all shadow-md whitespace-nowrap shrink-0"
                        >
                          {action.icon} {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 md:gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 md:p-2 pl-4 md:pl-5 rounded-xl md:rounded-full border border-transparent shadow-md focus-within:border-slate-300 dark:focus-within:border-slate-600 transition-all">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      placeholder="Ask Library Assistant..."
                      className="flex-1 bg-transparent border-none outline-none text-[15px] dark:text-white placeholder-slate-500 dark:placeholder-slate-400 w-full"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading || !input.trim()}
                      className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all shrink-0 ${input.trim() ? 'bg-indigo-600 text-white hover:opacity-90' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'}`}
                    >
                      <Send size={15} className="mr-[2px]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
