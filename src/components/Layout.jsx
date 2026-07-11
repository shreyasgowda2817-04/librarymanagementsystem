import React, { useState, useEffect, Suspense } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { API_URL } from "../config";
import {
  LayoutDashboard, BookOpen, Users, BarChart3,
  Settings, LogOut, Search, Bell, Menu, X,
  Command, ChevronRight, User, Sparkles, Library, Brain, ArrowRight,
  ArrowLeftRight, ShieldCheck, Activity, Trophy, Wrench, Banknote, DoorOpen, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import AIAssistant from "./AIAssistant";
import ChatSupport from "./ChatSupport";
import Footer from "./Footer";
import CommandPalette from "./CommandPalette";
import { useFeature } from "../context/FeatureContext";


export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ books: [], members: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [isAISearching, setIsAISearching] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { featureFlags } = useFeature();
  
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user") || "null"));
  const isAdmin = user?.role === "admin";

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) setNotifications(await res.json());
    } catch (e) { console.error(e); }
  };

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/notifications/read/${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (e) { console.error(e); }
  };

  const markAllAsRead = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success("All marked as read");
      }
    } catch (e) { console.error(e); }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications/clear-all`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${user.token}` }
      });
      if (res.ok) {
        setNotifications([]);
        toast.success("Notifications cleared");
      }
    } catch (e) { console.error(e); }
  };

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.isRead).length : 0;

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} /> },
    { name: "Books", path: "/books", icon: <BookOpen size={18} /> },
    { name: "Study Boards", path: "/research", icon: <Brain size={18} /> },
    featureFlags.leaderboard && { name: "Leaderboard", path: "/leaderboard", icon: <Trophy size={18} /> },
    featureFlags.reservations && { name: "Study Rooms", path: "/study-rooms", icon: <DoorOpen size={18} /> },
    featureFlags.reservations && { name: "Seat Map", path: "/seats", icon: <Library size={18} /> },
    { name: "Subcription", path: "/membership", icon: <Sparkles size={18} /> },
    { name: "Dues", path: "/fines", icon: <Activity size={18} /> },
    { name: "Scanner Portal", path: "/kiosk", icon: <Command size={18} />, adminOnly: true },
    { name: "Issue & Return", path: "/issue-return", icon: <ArrowLeftRight size={18} />, adminOnly: true },
    { name: "Admin Panel", path: "/console", icon: <ShieldCheck size={18} />, adminOnly: true },
    { name: "Library Tools", path: "/tools", icon: <Wrench size={18} />, adminOnly: true },
    { name: "Hardware Ops", path: "/hardware-ops", icon: <Activity size={18} />, adminOnly: true },
    { name: "Members", path: "/members", icon: <Users size={18} />, adminOnly: true },
    { name: "Reports", path: "/reports", icon: <BarChart3 size={18} />, adminOnly: true },
    { name: "Account Settings", path: "/profile", icon: <Settings size={18} /> },
  ].filter(Boolean);

  const filteredNav = navItems.filter(item => !item.adminOnly || isAdmin);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    fetchNotifications();

    const handleStorageChange = () => {
      setUser(JSON.parse(localStorage.getItem("user") || "null"));
    };
    window.addEventListener("storage", handleStorageChange);

    // Socket.io Connection
    const socket = io(API_URL);
    socket.on("connect", () => {
      if (user?._id) socket.emit("join", user._id);
    });

    socket.on("notification:new", (notification) => {
      setNotifications(prev => [notification, ...prev]);
      toast.success(`New Notification: ${notification.title}`);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener("storage", handleStorageChange);
      socket.disconnect();
    };
  }, [user?.token]);



  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("ai_chat_history");
    toast.success("Logged out successfully.");
    navigate("/login");
  };

  const searchTimeoutRef = React.useRef(null);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setAiResults(null);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults({ books: [], members: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/api/search?q=${query}`, {
          headers: { "Authorization": `Bearer ${user.token}` }
        });
        if (res.ok) {
          setSearchResults(await res.json());
        }
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleAISearch = async () => {
    if (!searchQuery.trim()) return;
    setIsAISearching(true);
    setAiResults(null);
    try {
      const res = await fetch(`${API_URL}/api/ai/explore`, {
        method: 'POST',
        headers: { 
          "Authorization": `Bearer ${user.token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query: searchQuery })
      });
      if (res.ok) {
        setAiResults(await res.json());
      } else {
        const errData = await res.json();
        toast.error(errData.error || "AI Search failed");
      }
    } catch (e) {
      console.error("AI Search failed", e);
      toast.error("Failed to run AI search.");
    } finally {
      setIsAISearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleAISearch();
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-500 font-sans selection:bg-indigo-500/30 overflow-hidden">

      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[400] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 h-full z-[500] bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out flex flex-col overflow-hidden 
          ${(isCollapsed && !isMobileMenuOpen) ? "w-20" : "w-[280px] md:w-72"} 
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Library size={20} />
            </div>
            {!isCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black text-xl tracking-tighter hidden lg:block">
                Library <span className="text-indigo-600">System</span>
              </motion.div>
            )}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-black text-xl tracking-tighter lg:hidden">
              Library <span className="text-indigo-600">System</span>
            </motion.div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto no-scrollbar">
          {filteredNav.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
              <div className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${location.pathname === item.path
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/10"
                : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
                }`}>
                <div className={`${location.pathname === item.path ? "text-white" : "text-slate-400 group-hover:text-indigo-600"}`}>
                  {item.icon}
                </div>
                {(!isCollapsed || isMobileMenuOpen) && <span className="font-bold text-sm tracking-tight">{item.name}</span>}
              </div>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-200 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition-all group ${isCollapsed && !isMobileMenuOpen ? "justify-center" : ""}`}
          >
            <LogOut size={18} />
            {(!isCollapsed || isMobileMenuOpen) && <span className="text-sm font-semibold">Logout</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ${isCollapsed ? "lg:pl-20" : "lg:pl-72"}`}>

        {/* HEADER */}
        <header className="h-20 bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-10 sticky top-0 z-[200] border-b border-slate-200 dark:border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 lg:gap-8">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden w-10 h-10 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 flex items-center justify-center shadow-md">
              <Menu size={20} />
            </button>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:flex w-10 h-10 bg-white dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-600/30 transition-all items-center justify-center shadow-md group">
              <Menu size={20} className="group-hover:scale-110 transition-transform" />
            </button>
            
            <div
              onClick={() => setShowSearch(true)}
              className="hidden md:flex items-center gap-3 px-5 py-2.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:border-indigo-500/40 transition-all cursor-pointer w-80 group"
            >
              <Search size={14} />
              <span className="text-xs font-bold flex-1">Search library...</span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-white/10 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded text-[9px] font-black">
                <Command size={10} /> K
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div>
              
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2.5 text-slate-400 hover:text-indigo-600 transition-all bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-[#020617] shadow-md">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                    className="absolute right-0 top-[130%] w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden z-[500]"
                  >
                    <div className="p-5 border-b border-slate-100 dark:border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/2 backdrop-blur-xl">
                      <h3 className="font-black text-sm tracking-tight">Notifications</h3>
                      <div className="flex gap-3 items-center">
                        {notifications.length > 0 && (
                          <button onClick={clearAllNotifications} className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest transition-colors">
                            Clear All
                          </button>
                        )}
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-[9px] font-black text-indigo-600 hover:text-indigo-500 uppercase tracking-widest transition-colors">
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center">
                          <div className="w-12 h-12 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-3 text-slate-400"><Bell size={20} /></div>
                          <p className="text-xs font-bold text-slate-500">All caught up!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                          {notifications.slice(0, 8).map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => !notif.isRead && markAsRead(notif._id)}
                              className={`p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-3 ${!notif.isRead ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!notif.isRead ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}>
                                <Bell size={12} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs mb-0.5 ${!notif.isRead ? 'font-bold' : 'text-slate-500'}`}>{notif.title}</p>
                                <p className="text-[10px] text-slate-500 line-clamp-1">{notif.message}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-[1px] shadow-md hover:scale-105 active:scale-95 transition-all"
            >
              <div className="w-full h-full bg-white dark:bg-[#020617] rounded-full overflow-hidden flex items-center justify-center text-indigo-600 dark:text-white font-black text-sm">
                {user?.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0)
                )}
              </div>
            </button>
          </div>
        </header>

        {/* STAGE */}
        <main className="flex-1 flex flex-col overflow-y-auto p-6 lg:p-10 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Suspense fallback={
                <div className="flex flex-col flex-1 items-center justify-center min-h-[50vh] text-slate-400">
                  <div className="animate-spin h-8 w-8 border-4 border-indigo-500/20 border-t-indigo-600 rounded-full mb-4"></div>
                  <p className="text-sm font-semibold tracking-tight">Loading module...</p>
                </div>
              }>
                {children}
              </Suspense>
            </motion.div>
          </AnimatePresence>
          <Footer isAdmin={isAdmin} />
        </main>
      </div>

      {featureFlags.aiAssistant && <AIAssistant />}
      <CommandPalette />

      {/* GLOBAL SEARCH */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-start justify-center pt-20 lg:pt-32 px-6 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults({ books: [], members: [] }); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              className="bg-white dark:bg-[#0f172a] w-full max-w-2xl rounded-xl shadow-md border border-slate-200 dark:border-slate-200 dark:border-slate-800 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 flex items-center gap-4 border-b border-slate-100 dark:border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-white/2">
                <Search className="text-indigo-600" size={20} />
                <input 
                  autoFocus 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search for ...." 
                  className="flex-1 bg-transparent border-none text-lg font-bold outline-none dark:text-white placeholder:text-sm placeholder:font-normal placeholder:text-slate-400" 
                />
                <button onClick={() => setShowSearch(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors">
                  <X size={18} className="text-slate-400" />
                </button>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 px-6 py-2 border-b border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                onClick={handleAISearch}
              >
                
                  
                  
                </div>
                
              

              <div className="max-h-[450px] overflow-y-auto p-4 no-scrollbar">
                {isSearching ? (
                  <div className="py-20 text-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Searching Catalog...</p>
                  </div>
                ) : !searchQuery ? (
                  <div className="py-20 text-center">
                    <Sparkles className="mx-auto mb-4 text-indigo-500 opacity-20" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Enter keywords to begin</p>
                  </div>
                ) : aiResults ? (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-between mb-4 px-2">
                      <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><Sparkles size={12}/> AI Curated Results</h4>
                      <div className="flex gap-1 flex-wrap">
                        {aiResults.keywords?.map((kw, i) => (
                          <span key={i} className="text-[8px] font-bold px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded uppercase">{kw}</span>
                        ))}
                      </div>
                    </div>

                    {aiResults.insight && (
                      <div className="mb-4 px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-xl relative">
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white dark:border-[#0f172a]">
                          <Brain size={12} />
                        </div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-2">{aiResults.insight}</p>
                      </div>
                    )}
                    
                    {aiResults.books?.length === 0 ? (
                      <div className="text-center py-20 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                        <BookOpen className="mx-auto text-slate-400 mb-2" size={32} />
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No semantic matches found.</p>
                        <p className="text-[10px] text-slate-500 mt-1">Try rewording your query.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {aiResults.books?.slice(0,6).map(book => (
                          <div key={book._id} onClick={() => { navigate("/books"); setShowSearch(false); }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all group flex flex-col">
                            <div className="h-32 bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                              {book.coverImage ? (
                                <img src={book.coverImage.startsWith('http') ? book.coverImage : `${API_URL}${book.coverImage}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-400"><BookOpen size={24} /></div>
                              )}
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                              <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-500 transition-colors mb-1">{book.title}</p>
                              <p className="text-[9px] text-slate-500 truncate mt-auto">{book.author}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (searchResults.books.length === 0 && searchResults.members.length === 0) ? (
                  <div className="py-20 text-center">
                    <p className="text-sm font-bold text-slate-500">No exact matches found for "{searchQuery}"</p>
                    <p className="text-[10px] text-slate-400 mt-2">Press <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Enter</kbd> to search with AI Assistant</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {searchResults.books.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Books</h4>
                        {searchResults.books.map(book => (
                          <div key={book._id} onClick={() => { navigate("/books"); setShowSearch(false); }} className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl cursor-pointer flex items-center gap-4 group transition-all">
                            <div className="w-10 h-12 bg-slate-100 dark:bg-white/10 rounded overflow-hidden">
                              {book.coverImage ? <img src={book.coverImage.startsWith('http') ? book.coverImage : `${API_URL}${book.coverImage}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><BookOpen size={14} className="text-slate-400"/></div>}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{book.title}</p>
                              <p className="text-[10px] text-slate-500">{book.author}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.members.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Members</h4>
                        {searchResults.members.map(member => (
                          <div key={member._id} onClick={() => { navigate("/members"); setShowSearch(false); }} className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl cursor-pointer flex items-center gap-4 group transition-all">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{member.name}</p>
                              <p className="text-[10px] text-slate-500">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}


              </div>
              

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
