import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToggleDarkMode() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="p-2.5 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all group overflow-hidden relative"
      title={dark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={dark ? 'dark' : 'light'}
          initial={{ y: 20, opacity: 0, rotate: 45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: -20, opacity: 0, rotate: -45 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="relative z-10"
        >
          {dark ? <Moon size={20} /> : <Sun size={20} />}
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors"></div>
    </button>
  );
}
