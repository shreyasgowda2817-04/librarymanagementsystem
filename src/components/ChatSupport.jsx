import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from "../config";
import { 
  MessageSquare, X, Send, Headset, User, 
  Info, Clock, Book, ChevronRight, 
  Smile, ThumbsUp, ThumbsDown, Mic, 
  Star, CreditCard, Zap, Layers, CheckCircle, Sparkles,
  Search, HelpCircle, History, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeature } from "../context/FeatureContext";

const ChatSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { featureFlags } = useFeature();
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('library_chat_history_v2');
    return saved ? JSON.parse(saved) : [
      { 
        id: 1, 
        text: "Hello! I'm your Support Assistant. How can I help you with the library system today?", 
        sender: 'bot', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // home, chat
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === 'chat') scrollToBottom();
    localStorage.setItem('library_chat_history_v2', JSON.stringify(messages));
  }, [messages, isTyping, activeTab]);
  
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setActiveTab('home');
    };
    window.addEventListener('openChatSupport', handleOpen);
    return () => window.removeEventListener('openChatSupport', handleOpen);
  }, []);

  const handleSendMessage = async (text) => {
    const messageText = typeof text === 'string' ? text : inputText;
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setActiveTab('chat');
    setIsTyping(true);

    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      
      if (!user || !user.token) {
        const loginMsg = {
          id: Date.now() + 1,
          text: "Please log in or create an account to use the AI Support Assistant.",
          sender: 'bot',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, loginMsg]);
        setIsTyping(false);
        return;
      }
      const res = await axios.post(`${API_URL}/api/ai/chat`, {
        message: messageText,
        history: messages.slice(-4).map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))
      }, { headers: { Authorization: `Bearer ${user?.token}` } });

      const botMsg = {
        id: Date.now() + 1,
        text: res.data.reply || "Sorry, I couldn't process that. Please try again later.",
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      toast.error("Connection lost. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  if (featureFlags && featureFlags.aiAssistant === false) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-[1000] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-24 right-0 w-[400px] h-[600px] bg-white dark:bg-slate-900 rounded-xl shadow-md flex flex-col overflow-hidden border border-slate-200 dark:border-slate-200 dark:border-slate-800"
          >
            {/* HEADER */}
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                     <Headset size={20} />
                  </div>
                  <div>
                     <h3 className="text-sm font-bold tracking-tight">Chat Support</h3>
                     <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Online</p>
                  </div>
               </div>
               <button onClick={() => setIsOpen(false)} className="p-2 rounded-xl hover:bg-white/10 transition-all">
                  <X size={18} />
               </button>
            </div>

            {/* 🔄 VIEW CONTENT */}
            <div className="flex-1 overflow-hidden relative">
               <AnimatePresence mode="wait">
                  {activeTab === 'home' ? (
                    <motion.div
                      key="home"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-6 space-y-6 overflow-y-auto h-full custom-scrollbar"
                    >
                       <div className="space-y-1">
                          <h4 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Hello there! 👋</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">How can we help you today?</p>
                       </div>

                       <div className="grid grid-cols-1 gap-3">
                          {[
                             { icon: Search, title: "Find Books", desc: "Search our catalog", cmd: "How do I search for books?" },
                             { icon: History, title: "Borrowing Status", desc: "View your current books", cmd: "Show my current issued books" },
                             { icon: Zap, title: "Pay Fines", desc: "Manage pending payments", cmd: "How can I pay my fines?" },
                             { icon: HelpCircle, title: "Library Help", desc: "Common questions", cmd: "What are the library hours?" }
                          ].map((item, i) => (
                            <button 
                              key={i} 
                              onClick={() => handleSendMessage(item.cmd)}
                              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all text-left group shadow-md"
                            >
                               <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><item.icon size={16} /></div>
                                  <div>
                                     <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{item.title}</p>
                                     <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{item.desc}</p>
                                  </div>
                               </div>
                               <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </button>
                          ))}
                       </div>

                       <button 
                          onClick={() => setActiveTab('chat')}
                          className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:bg-indigo-700 transition-all"
                       >
                          Chat with us
                       </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="chat"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col h-full"
                    >
                       <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                          {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-xl text-sm leading-relaxed shadow-md ${
                                 msg.sender === 'user' 
                                   ? 'bg-indigo-600 text-white' 
                                   : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700'
                               }`}>
                                  {(msg.text || "Message unavailable").split('**').map((part, i) => i % 2 === 1 ? <b key={i} className="text-indigo-500">{part}</b> : part)}
                                  <div className={`mt-2 text-[8px] font-bold uppercase tracking-wider opacity-50 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                     {msg.time}
                                  </div>
                               </div>
                            </div>
                          ))}
                          {isTyping && (
                            <div className="flex justify-start">
                               <div className="bg-slate-100 dark:bg-white/5 p-5 rounded-xl rounded-tl-none flex gap-2 items-center">
                                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-duration:0.6s]"></div>
                                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.1s]"></div>
                                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:0.2s]"></div>
                               </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                       </div>

                       <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-200 dark:border-slate-800">
                          <form 
                             onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                             className="flex gap-3"
                          >
                             <input 
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type your inquiry..."
                                className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl px-5 py-3.5 text-sm outline-none focus:border-indigo-500 transition-all font-medium"
                             />
                             <button 
                                type="submit"
                                disabled={!inputText.trim()}
                                className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                             >
                                <Send size={18} />
                             </button>
                          </form>
                          <div className="mt-4 flex items-center justify-center gap-2 opacity-30">
                             <CheckCircle size={10} />
                             <span className="text-[8px] font-bold uppercase tracking-widest">Support is online</span>
                          </div>
                       </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING BUBBLE REMOVED - NOW ACCESSIBLE VIA FOOTER */}
    </div>
  );
};

export default ChatSupport;
