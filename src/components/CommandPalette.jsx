import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Book, Settings, User, Bell, 
  Moon, Sun, Command, LogOut, Layout,
  Shield, Activity, Globe
} from 'lucide-react';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const togglePalette = useCallback(() => setIsOpen(prev => !prev), []);

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        togglePalette();
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [togglePalette]);

  const actions = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: Layout, category: 'Navigation', run: () => navigate('/dashboard') },
    { id: 'catalog', label: 'Browse Library', icon: Book, category: 'Navigation', run: () => navigate('/books') },
    { id: 'settings', label: 'Account Settings', icon: Settings, category: 'Navigation', run: () => navigate('/profile') },
    { id: 'profile', label: 'My Profile', icon: User, category: 'Account', run: () => navigate('/profile?tab=account') },
    { id: 'notifications', label: 'Notifications', icon: Bell, category: 'Account', run: () => navigate('/profile?tab=history') },
    { id: 'dark-mode', label: 'Toggle Dark Mode', icon: Moon, category: 'System', run: () => {
      const isDark = document.documentElement.classList.contains('dark');
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'light' : 'dark');
    }},
    { id: 'logout', label: 'Sign Out', icon: LogOut, category: 'System', run: () => {
      localStorage.removeItem('user');
      navigate('/login');
    }},
  ].filter(action => action.label.toLowerCase().includes(search.toLowerCase()));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[20000] flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -20 }}
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden"
      >
        <div className="flex items-center px-6 py-5 border-b border-slate-100 dark:border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <Search className="text-slate-400 mr-4" size={20} />
          <input
            autoFocus
            placeholder="Type a command or search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-white font-medium placeholder:text-slate-400"
          />
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-200 dark:bg-white/10 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Command size={10} /> K
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-3 custom-scrollbar">
          {actions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-medium">
              No results found for "{search}"
            </div>
          ) : (
            <div className="space-y-4">
              {['Navigation', 'Account', 'System'].map(cat => {
                const catActions = actions.filter(a => a.category === cat);
                if (catActions.length === 0) return null;
                return (
                  <div key={cat} className="space-y-1">
                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 font-medium tracking-wide">{cat}</p>
                    {catActions.map(action => (
                      <button
                        key={action.id}
                        onClick={() => { action.run(); setIsOpen(false); }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 group transition-all text-left"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-indigo-500/20 transition-colors">
                            <action.icon size={18} />
                          </div>
                          <span className="font-bold text-sm">{action.label}</span>
                        </div>
                        <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-500" />
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex gap-4">
            <span>↑↓ to navigate</span>
            <span>↵ to select</span>
          </div>
          <span>Esc to close</span>
        </div>
      </motion.div>
    </div>
  );
};

const ChevronRight = ({ size, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default CommandPalette;
