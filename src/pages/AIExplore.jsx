import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function AIExplore() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.query) {
      const initialQuery = location.state.query;
      setQuery(initialQuery);
      handleSearch(initialQuery);
      window.history.replaceState({}, document.title); // prevent refire on reload
    }
  }, [location.state]);

  const presets = [
    "I want a fast-paced sci-fi thriller about space",
    "Books to help me learn Python programming",
    "Historical biographies of strong leaders",
    "A cozy mystery set in a small town"
  ];

  const handleSearch = async (searchQuery) => {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setIsSearching(true);
    setResults(null);
    setQuery(q); // ensure input box updates if preset is clicked

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axios.post(
        `${API_URL}/api/ai/explore`, 
        { query: q }, 
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      
      setResults(res.data);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to process search.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-12 min-h-[80vh] flex flex-col">
      {/* Hero Section */}
      <div className={`transition-all duration-700 ease-in-out flex flex-col items-center justify-center ${results ? 'pt-8 pb-12' : 'flex-1'}`}>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-6 shadow-inner">
            <Sparkles size={32} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Explore</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
            Describe what you're looking for in plain English. Our AI will analyze your intent and instantly curate the perfect reading list from our library.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="w-full max-w-3xl relative z-10"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
              className="relative bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-2 flex items-center shadow-xl transition-all focus-within:border-indigo-500 dark:focus-within:border-indigo-500"
            >
              <div className="pl-4 pr-2 text-slate-400">
                {isSearching ? <Loader2 className="animate-spin text-indigo-500" size={24} /> : <Search size={24} />}
              </div>
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to learn or experience today?"
                className="flex-1 bg-transparent border-none outline-none text-lg py-4 px-2 text-slate-900 dark:text-white placeholder-slate-400"
                disabled={isSearching}
              />
              <button 
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                Search <ArrowRight size={18} />
              </button>
            </form>
          </div>

          {/* Presets */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {presets.map((preset, idx) => (
              <button 
                key={idx}
                onClick={() => handleSearch(preset)}
                disabled={isSearching}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {results && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 border-t border-slate-200 dark:border-slate-800 pt-12"
          >
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3">AI Curated Results</h2>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mr-2 flex items-center">Detected Keywords:</span>
                {results.keywords?.map((kw, i) => (
                  <span key={i} className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 rounded-lg text-xs font-bold uppercase">
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {results.books?.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <BookOpen className="mx-auto text-slate-400 mb-4" size={48} />
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No exact matches found</h3>
                <p className="text-slate-500">The AI understood your intent, but we don't have any books matching those exact themes right now. Try a broader search!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {results.books?.map((book, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    key={book._id} 
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
                  >
                    <div className="aspect-[2/3] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                      {book.coverImage ? (
                        <img src={book.coverImage.startsWith('http') ? book.coverImage : `${API_URL}${book.coverImage}`} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400"><BookOpen size={32} /></div>
                      )}
                      
                      {/* Availability Badge */}
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-1 text-[9px] font-black uppercase rounded shadow-sm ${
                          book.status === 'Available' ? 'bg-emerald-500 text-white' : 
                          book.status === 'Reserved' ? 'bg-amber-500 text-white' : 
                          'bg-rose-500 text-white'
                        }`}>
                          {book.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">{book.title}</h4>
                      <p className="text-xs text-slate-500 mb-3">{book.author}</p>
                      <div className="mt-auto">
                        <span className="inline-block px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded uppercase truncate max-w-full">
                          {book.category}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
