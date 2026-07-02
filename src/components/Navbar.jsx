import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaSignOutAlt, FaBookOpen, FaCircle, FaCheckDouble, FaTrashAlt } from "react-icons/fa";
import { API_URL } from "../config";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

export default function Navbar() {
  const nav = useNavigate();
  const userObj = JSON.parse(localStorage.getItem("user") || "{}");
  const token = userObj.token;

  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/notifications`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error("Notification Sync Failed");
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    const handleNewNotif = (e) => {
      const newNotif = e.detail;
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener("new-notification", handleNewNotif);
    const interval = setInterval(fetchNotifications, 60000); // Background sync every 60s
    
    return () => {
      window.removeEventListener("new-notification", handleNewNotif);
      clearInterval(interval);
    };
  }, [token]);

  const markAsRead = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/notifications/read/${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success("Protocol Alert Acknowledged", { id: 'notif-read' });
      }
    } catch (err) {
      toast.error("Handshake Failed");
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/notifications/read-all`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All System Alerts Synchronized");
      }
    } catch (err) {
      toast.error("Global Handshake Failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("ai_chat_history");
    nav("/login");
  };

  return (
    <header className="bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-3xl border-b border-slate-100 dark:border-slate-200 dark:border-slate-800 px-8 py-5 flex justify-between items-center sticky top-0 z-[100] shadow-md">
      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => nav("/dashboard")}>
        <div className="bg-indigo-600 p-2.5 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-110 transition-transform">
          <FaBookOpen className="text-white" size={20} />
        </div>
        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Infrastructure</span>
      </div>

      <div className="flex items-center gap-6">
        {/* 🔔 NOTIFICATION SYSTEM */}
        <div className="relative">
          <button 
            onClick={() => setShowPanel(!showPanel)}
            className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-95 relative"
          >
            <FaBell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-[#0f172a] animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showPanel && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-6 w-[400px] bg-white dark:bg-[#0f172a] rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden z-50"
              >
                <div className="p-8 border-b border-slate-50 dark:border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-white/2 flex justify-between items-center">
                  <h3 className="text-xl font-black tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:underline">
                      <FaCheckDouble /> Clear Buffer
                    </button>
                  )}
                </div>

                <div className="max-h-[450px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-50 dark:divide-white/5">
                      {notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => !notif.isRead && markAsRead(notif.id)}
                          className={`p-6 hover:bg-slate-50 dark:hover:bg-white/2 transition-all cursor-pointer flex gap-5 group ${!notif.isRead ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                            notif.type === 'overdue' ? 'bg-rose-500/10 text-rose-500' : 
                            notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-600'
                          }`}>
                            <FaCircle size={8} className={!notif.isRead ? 'animate-pulse' : 'opacity-20'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-black text-sm mb-1 leading-tight">{notif.title}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 mb-2 font-medium">{notif.message}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-24 text-center px-12">
                      <FaBell className="mx-auto text-slate-200 dark:text-white/5 mb-6" size={48} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Active Alerts</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/5"></div>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-6 py-3 bg-rose-500/10 text-rose-500 rounded-xl text-sm font-semibold hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-md"
        >
          <FaSignOutAlt /> Terminate Session
        </button>
      </div>
    </header>
  );
}
