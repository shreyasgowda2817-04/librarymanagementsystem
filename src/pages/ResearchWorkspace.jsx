import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaTrash, FaBook, FaSearch, FaTimes, FaSave, FaFileAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function ResearchWorkspace() {
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  
  // Book Linking State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (activeWorkspace) {
      setTitle(activeWorkspace.title);
      setContent(activeWorkspace.content);
    }
  }, [activeWorkspace]);

  const getHeaders = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return { Authorization: `Bearer ${user?.token}` };
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/workspaces`, { headers: getHeaders() });
      setWorkspaces(res.data);
      if (res.data.length > 0 && !activeWorkspace) {
        setActiveWorkspace(res.data[0]);
      }
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load workspaces');
      setIsLoading(false);
    }
  };

  const handleCreateWorkspace = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/workspaces`, { title: 'Untitled Workspace' }, { headers: getHeaders() });
      setWorkspaces([res.data, ...workspaces]);
      setActiveWorkspace(res.data);
    } catch (err) {
      toast.error('Failed to create workspace');
    }
  };

  const handleSaveWorkspace = async () => {
    if (!activeWorkspace) return;
    setIsSaving(true);
    try {
      const res = await axios.put(
        `${API_URL}/api/workspaces/${activeWorkspace._id}`,
        { title, content },
        { headers: getHeaders() }
      );
      
      const updated = res.data;
      setWorkspaces(workspaces.map(w => w._id === updated._id ? updated : w));
      setActiveWorkspace(updated);
      toast.success('Saved automatically', { position: 'bottom-right', duration: 2000, style: { background: '#333', color: '#fff', fontSize: '12px' } });
    } catch (err) {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWorkspace = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this workspace?")) return;
    try {
      await axios.delete(`${API_URL}/api/workspaces/${id}`, { headers: getHeaders() });
      setWorkspaces(workspaces.filter(w => w._id !== id));
      if (activeWorkspace?._id === id) {
        setActiveWorkspace(workspaces.length > 1 ? workspaces.find(w => w._id !== id) : null);
      }
      toast.success('Workspace deleted');
    } catch (err) {
      toast.error('Failed to delete workspace');
    }
  };

  const searchBooks = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const res = await axios.get(`${API_URL}/api/books?search=${searchQuery}`, { headers: getHeaders() });
      setSearchResults(res.data.books || res.data);
    } catch (err) {
      toast.error('Failed to search books');
    }
  };

  const handleLinkBook = async (book) => {
    if (!activeWorkspace) return;
    
    // Check if already linked
    if (activeWorkspace.linkedBooks.some(b => b._id === book._id)) {
      toast.error('Book already linked to this workspace');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/api/workspaces/${activeWorkspace._id}/link-book`,
        { bookId: book._id },
        { headers: getHeaders() }
      );
      
      const updated = res.data;
      setWorkspaces(workspaces.map(w => w._id === updated._id ? updated : w));
      setActiveWorkspace(updated);
      setIsSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      toast.success('Book linked successfully');
    } catch (err) {
      toast.error('Failed to link book');
    }
  };

  const handleUnlinkBook = async (bookId) => {
    if (!activeWorkspace) return;
    try {
      const res = await axios.delete(
        `${API_URL}/api/workspaces/${activeWorkspace._id}/link-book/${bookId}`,
        { headers: getHeaders() }
      );
      const updated = res.data;
      setWorkspaces(workspaces.map(w => w._id === updated._id ? updated : w));
      setActiveWorkspace(updated);
      toast.success('Book unlinked');
    } catch (err) {
      toast.error('Failed to unlink book');
    }
  };

  // Debounced auto-save effect
  useEffect(() => {
    if (!activeWorkspace) return;
    if (title === activeWorkspace.title && content === activeWorkspace.content) return;

    const timer = setTimeout(() => {
      handleSaveWorkspace();
    }, 1500);

    return () => clearTimeout(timer);
  }, [title, content]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 pb-12 flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">
      
      {/* LEFT SIDEBAR: Workspace List */}
      <div className="w-full md:w-64 shrink-0 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">Study Boards</h2>
          <button 
            onClick={handleCreateWorkspace}
            className="p-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
          >
            <FaPlus size={12} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {workspaces.length === 0 ? (
            <div className="text-center p-4 text-xs text-slate-500">
              No workspaces yet. Create one!
            </div>
          ) : (
            workspaces.map(w => (
              <div 
                key={w._id} 
                onClick={() => setActiveWorkspace(w)}
                className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-all ${activeWorkspace?._id === w._id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <FaFileAlt className={`shrink-0 ${activeWorkspace?._id === w._id ? 'text-indigo-200' : 'text-slate-400'}`} size={12} />
                  <span className="text-sm font-semibold truncate">{w.title || 'Untitled'}</span>
                </div>
                <button 
                  onClick={(e) => handleDeleteWorkspace(e, w._id)}
                  className={`p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${activeWorkspace?._id === w._id ? 'hover:bg-white/20 text-white' : 'hover:bg-rose-100 text-rose-500'}`}
                >
                  <FaTrash size={10} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN EDITOR AREA */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative">
        {activeWorkspace ? (
          <>
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled Workspace"
                  className="w-full text-3xl font-black text-slate-900 dark:text-white bg-transparent outline-none placeholder-slate-300 dark:placeholder-slate-700 mb-2"
                />
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {isSaving ? (
                    <span className="flex items-center gap-1 text-indigo-500"><div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div> Saving...</span>
                  ) : (
                    <span>Last edited {new Date(activeWorkspace.lastAccessed).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <button 
                onClick={handleSaveWorkspace}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                <FaSave size={14} />
                {isSaving ? 'Saving...' : 'Save Now'}
              </button>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Note Editor */}
              <div className="flex-1 p-6 overflow-y-auto">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your research notes here... Use markdown or plain text."
                  className="w-full h-full min-h-[400px] resize-none bg-transparent outline-none text-slate-700 dark:text-slate-300 text-base leading-relaxed custom-scrollbar placeholder-slate-400 dark:placeholder-slate-600"
                />
              </div>

              {/* Linked Books Panel */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FaBook className="text-indigo-600" /> Linked Sources
                  </h3>
                  <button 
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="p-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {isSearchOpen && (
                  <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <form onSubmit={searchBooks} className="relative mb-3">
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search library..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all dark:text-white"
                      />
                      <FaSearch className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    </form>
                    
                    <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
                      {searchResults.length === 0 && searchQuery && (
                        <p className="text-xs text-center text-slate-500 py-4">Press enter to search.</p>
                      )}
                      {searchResults.map(book => (
                        <div key={book._id} className="p-2 border border-slate-100 dark:border-slate-800 rounded-lg flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer" onClick={() => handleLinkBook(book)}>
                          <div className="w-10 h-14 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden shrink-0">
                             {book.coverImage ? (
                                <img src={book.coverImage.startsWith('http') ? book.coverImage : `${API_URL}${book.coverImage}`} alt={book.title} className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400"><FaBook size={10} /></div>
                             )}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{book.title}</p>
                            <p className="text-[10px] text-slate-500 truncate">{book.author}</p>
                          </div>
                          <div className="flex items-center">
                             <FaPlus className="text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" size={12} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {activeWorkspace.linkedBooks?.length === 0 ? (
                    <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <FaBook className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={24} />
                      <p className="text-xs font-bold text-slate-500">No sources linked yet</p>
                      <p className="text-[10px] text-slate-400 mt-1">Link books to keep your research organized</p>
                    </div>
                  ) : (
                    activeWorkspace.linkedBooks?.map(book => (
                      <div key={book._id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex gap-3 group relative">
                        <div className="w-12 h-16 bg-slate-200 dark:bg-slate-700 rounded-md overflow-hidden shrink-0 shadow-sm">
                           {book.coverImage ? (
                              <img src={book.coverImage.startsWith('http') ? book.coverImage : `${API_URL}${book.coverImage}`} alt={book.title} className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400"><FaBook size={14} /></div>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{book.title}</p>
                          <p className="text-[10px] text-slate-500 mt-1 truncate">{book.author}</p>
                          {book.category && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold uppercase rounded">
                              {book.category}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleUnlinkBook(book._id); }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-slate-800 text-rose-500 rounded-full shadow-md border border-slate-100 dark:border-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 hover:text-rose-600"
                        >
                          <FaTimes size={10} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <FaFileAlt size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Research Workspace</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-8">
              Create a new study board to start taking notes, organize your thoughts, and link library books directly to your research.
            </p>
            <button 
              onClick={handleCreateWorkspace}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              <FaPlus /> Create New Board
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
