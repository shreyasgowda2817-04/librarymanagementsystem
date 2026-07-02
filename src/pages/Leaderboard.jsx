import React, { useState, useEffect } from "react";
import { FaTrophy, FaMedal, FaStar, FaCrown } from "react-icons/fa";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const LEVELS = [
  { name: "Novice Reader", min: 0 },
  { name: "Book Worm", min: 51 },
  { name: "Library Sage", min: 201 },
  { name: "Grand Master", min: 501 }
];

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const currentPoints = currentUser?.points || 0;
  
  const nextLevel = LEVELS.find(l => l.min > currentPoints) || LEVELS[LEVELS.length - 1];
  const prevLevel = LEVELS.slice().reverse().find(l => l.min <= currentPoints) || LEVELS[0];
  const progressPercent = nextLevel.min === prevLevel.min ? 100 : Math.min(100, ((currentPoints - prevLevel.min) / (nextLevel.min - prevLevel.min)) * 100);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auth/leaderboard`, {
        headers: { Authorization: `Bearer ${currentUser?.token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setLeaders(data);
      } else {
        toast.error("Failed to load leaderboard");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (index) => {
    switch(index) {
      case 0: return <FaCrown className="text-yellow-400 drop-shadow-md" size={24} />;
      case 1: return <FaMedal className="text-slate-300 drop-shadow-md" size={24} />;
      case 2: return <FaMedal className="text-amber-600 drop-shadow-md" size={24} />;
      default: return <span className="text-slate-500 font-bold text-lg">#{index + 1}</span>;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 pb-20 font-sans">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-10 pb-10 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-5 dark:opacity-10 pointer-events-none">
          <FaTrophy size={300} className="text-indigo-500 transform rotate-12" />
        </div>
        <div className="max-w-[1200px] mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <FaTrophy size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Hall of Fame</h1>
            <p className="text-slate-500 mt-2 text-lg">Compete with other members. Earn points by borrowing books and writing reviews.</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12 flex flex-col lg:flex-row gap-10">
        
        {/* Left Column: Leaderboard Table */}
        <div className="flex-[2] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FaStar className="text-amber-500" /> Top Readers
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-10 space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="animate-pulse flex gap-4 items-center">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                    <div className="flex-1 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                  </div>
                ))}
              </div>
            ) : (
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest text-center">Rank</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Reader</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Level</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {leaders.map((leader, index) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      key={leader._id} 
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${currentUser?._id === leader._id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}
                    >
                      <td className="p-4 align-middle text-center">
                        <div className="flex justify-center">{getRankBadge(index)}</div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-3">
                          {leader.profilePhoto ? (
                            <img src={leader.profilePhoto} className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-200 dark:border-slate-700" alt="avatar" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {leader.name.charAt(0)}
                            </div>
                          )}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {leader.name} {currentUser?._id === leader._id && <span className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase font-black">You</span>}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                          {leader.level || "Novice Reader"}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-right">
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{leader.points || 0}</span>
                      </td>
                    </motion.tr>
                  ))}
                  {leaders.length === 0 && (
                    <tr>
                      <td colSpan="4" className="p-10 text-center text-slate-500">No active readers yet. Start borrowing books to appear here!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            )}
          </div>
        </div>

        {/* Right Column: User Stats */}
        <div className="flex-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-md p-8 text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10">
              <FaCrown size={150} />
            </div>
            
            <h3 className="text-indigo-100 font-medium mb-1">Your Current Status</h3>
            <h2 className="text-3xl font-black mb-6">{currentUser?.level || "Novice Reader"}</h2>
            
            <div className="flex items-end gap-2 mb-2">
              <span className="text-4xl font-black">{currentPoints}</span>
              <span className="text-indigo-200 mb-1 font-medium">pts</span>
            </div>
            
            <div className="mt-8">
              <div className="flex justify-between text-xs font-semibold text-indigo-100 mb-2">
                <span>{prevLevel.name}</span>
                {nextLevel.name !== prevLevel.name && <span>{nextLevel.name} ({nextLevel.min} pts)</span>}
              </div>
              <div className="w-full bg-black/20 rounded-full h-3 backdrop-blur-sm overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{ width: `${progressPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              {nextLevel.name !== prevLevel.name && (
                <p className="text-xs text-indigo-200 mt-3 font-medium text-center">
                  Earn {nextLevel.min - currentPoints} more points to reach {nextLevel.name}!
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">How to earn points</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <span className="font-bold text-xs">+10</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Borrow a Book</p>
                  <p className="text-xs text-slate-500">Points awarded when your reservation is approved.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <span className="font-bold text-xs">+20</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Return on Time</p>
                  <p className="text-xs text-slate-500">Points awarded for returning a physical book before the due date.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <span className="font-bold text-xs">+15</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Write a Review</p>
                  <p className="text-xs text-slate-500">Share your thoughts on a book you've read.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
