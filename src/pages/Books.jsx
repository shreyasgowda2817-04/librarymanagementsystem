import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { API_URL } from "../config";
import {
  FaBookOpen, FaSearch, FaFilter, FaDownload, FaEdit, FaTimes,
  FaSave, FaSpinner, FaStar, FaThLarge, FaList, FaBook,
  FaHeart, FaRegHeart, FaPlus, FaMagic, FaRobot, FaBolt, FaLayerGroup, FaRegLightbulb,
  FaEye, FaCloudDownloadAlt, FaTimesCircle, FaCog,
  FaFilePdf, FaImage, FaTrash, FaPlay, FaPause, FaStop, FaTachometerAlt, FaCheck
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import BookReviewsModal from "../components/BookReviewsModal";

export default function Books() {
  const [booksData, setBooksData] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("physical");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [aiAnalysisBook, setAiAnalysisBook] = useState(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", author: "", category: "", stock: 1, barcode: "", pdf: null });
  const [editLoading, setEditLoading] = useState(false);
  const [readingBook, setReadingBook] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [reviewBook, setReviewBook] = useState(null);

  // Audiobook State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isAdvancedAudio, setIsAdvancedAudio] = useState(false);
  const [audioVolume, setAudioVolume] = useState(1);
  const [audioPitch, setAudioPitch] = useState(1);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [availableVoices, setAvailableVoices] = useState([]);
  const [extractedPdfText, setExtractedPdfText] = useState("");
  const [isExtractingText, setIsExtractingText] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!user || !user.token) return;

    fetch(`${API_URL}/api/books`, {
      headers: { Authorization: `Bearer ${user.token}` },
      credentials: 'include'
    })

      .then(res => res.json())
      .then(data => {
        setBooksData(Array.isArray(data) ? data : (data.books || []));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${user.token}` },
      credentials: 'include'
    })

      .then(res => res.json())
      .then(data => {
        setFavorites(Array.isArray(data.favorites) ? data.favorites : []);
        // Auto-sync localStorage with fresh backend permissions
        const currentUser = JSON.parse(localStorage.getItem("user") || "null");
        if (currentUser && data.id) {
          const syncedUser = { ...currentUser, ...data };
          localStorage.setItem("user", JSON.stringify(syncedUser));
          if (currentUser.limits?.digitalAccess !== data.limits?.digitalAccess) {
            window.location.reload();
          }
        }
      })
      .catch(err => console.error("Error fetching user data:", err));

    const loadVoices = () => {
      setAvailableVoices(window.speechSynthesis.getVoices());
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      window.speechSynthesis.cancel();
    };
  }, []);

  const fetchSecurePdf = async (url) => {
    if (!user?.token) {
      console.error("PDF Access Error: Missing User Token");
      toast.error("Authentication required for PDF access.");
      return null;
    }
    setIsPdfLoading(true);
    console.log("Attempting secure PDF fetch from:", url);
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.token}` },
        credentials: 'include'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Secure PDF Fetch Failed:", res.status, errorData);
        throw new Error(errorData.message || "Forbidden Access: Login Required");
      }
      const blob = await res.blob();
      const localUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(localUrl);
      return localUrl;
    } catch (err) {
      console.error("PDF Security Block Detail:", err);
      toast.error("Access denied: " + err.message);
      return null;
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleReadNow = async (book) => {
    if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    setPdfBlobUrl(null);
    setExtractedPdfText("");
    setReadingBook(book);
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);

    let url = book.pdfUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

    // Construct secure endpoint for backend-hosted GridFS PDFs
    // If it's a static file in /uploads/, treat it as a normal external URL
    if ((url.includes(API_URL) || url.startsWith("/api")) && !url.includes("/uploads/")) {
      const bookId = book._id || book.id;
      url = `${API_URL}/api/books/read/${bookId}`;
      await fetchSecurePdf(url);
    } else {
      setPdfBlobUrl(url); // External URL, static upload, or fallback
    }
  };

  const loadPdfJs = () => {
    return new Promise((resolve) => {
      if (window.pdfjsLib) return resolve(window.pdfjsLib);
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      document.body.appendChild(script);
    });
  };

  const extractTextFromPdf = async (url) => {
    try {
      setIsExtractingText(true);
      const pdfjsLib = await loadPdfJs();
      const pdf = await pdfjsLib.getDocument(url).promise;
      let fullText = "";
      // Extract up to first 5 pages for audiobook preview to avoid hanging the browser
      const numPages = Math.min(pdf.numPages, 5); 
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + " ";
      }
      setExtractedPdfText(fullText.trim());
      return fullText.trim();
    } catch (e) {
      console.error("PDF Text Extraction failed:", e);
      toast.error("Could not extract text from this PDF for audio playback.");
      return null;
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleToggleAudio = async () => {
    if (isPlayingAudio) {
      window.speechSynthesis.pause();
      setIsPlayingAudio(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlayingAudio(true);
      } else {
        let textToRead = extractedPdfText;
        if (!textToRead && pdfBlobUrl) {
          textToRead = await extractTextFromPdf(pdfBlobUrl);
        }
        
        if (!textToRead) {
          textToRead = readingBook?.description || `Welcome to the audiobook summary of ${readingBook?.title}. Unfortunately, we could not extract text from the PDF file for this book.`;
        }

        // REAL TRANSLATION LOGIC
        if (selectedLanguage !== 'en') {
          try {
            toast.loading(`Translating to ${selectedLanguage === 'hi' ? 'Hindi' : 'Kannada'}...`, { id: "translation" });
            const langName = selectedLanguage === 'hi' ? 'Hindi' : 'Kannada';
            
            // Limit text to avoid overwhelming AI limits
            const textToTranslate = textToRead.substring(0, 2000);
            
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/api/ai/analyze`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ message: `Translate the following text to ${langName}. Return ONLY the translated text, absolutely no other formatting or introductory remarks:\n\n${textToTranslate}` })
            });
            const data = await response.json();
            if (response.ok && data.reply) {
              textToRead = data.reply;
              toast.success("Translation complete!", { id: "translation" });
            } else {
              throw new Error(data.error || "Translation failed");
            }
          } catch (e) {
            console.error(e);
            toast.error("AI Translation failed. Using English fallback.", { id: "translation" });
          }
        }

        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = playbackSpeed;
        
        // Find matching voice for selected language
        const voice = availableVoices.find(v => v.lang.replace('_', '-').split('-')[0].toLowerCase() === selectedLanguage);
        if (voice) {
          utterance.voice = voice;
        }
        
        utterance.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  const handleStopAudio = () => {
    window.speechSynthesis.cancel();
    setIsPlayingAudio(false);
  };

  const handleDownload = async (book) => {
    if (!book) return;
    toast.success(`Preparing download for ${book.title}...`, { icon: "🔐" });

    let url = book.pdfUrl || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
    let downloadUrl = url;

    if ((url.includes(API_URL) || url.startsWith("/api")) && !url.includes("/uploads/")) {
      const bookId = book._id || book.id;
      const secureEndpoint = `${API_URL}/api/books/read/${bookId}`;
      const secureUrl = await fetchSecurePdf(secureEndpoint);

      if (secureUrl) downloadUrl = secureUrl;
      else return;
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${book.title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAiAnalysis = async (book) => {
    setAiAnalysisBook(book);
    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);

    try {
      const prompt = `Act as a professional university librarian. Provide a detailed summary, 3 key takeaways, and a brief recommendation (why read it) for the book "${book.title}" by "${book.author}". Format your response as a JSON object with keys: "summary", "keyTakeaways" (an array), and "whyRead".`;

      const res = await fetch(`${API_URL}/api/ai/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        credentials: 'include',
        body: JSON.stringify({ message: prompt })

      });

      const data = await res.json();

      // Parse the JSON from the AI response (handling potential markdown formatting)
      let aiJson;
      try {
        const cleanJson = data.reply.replace(/```json|```/g, "").trim();
        aiJson = JSON.parse(cleanJson);
      } catch (e) {
        // Fallback if AI doesn't return pure JSON
        aiJson = {
          summary: data.reply.substring(0, 200) + "...",
          keyTakeaways: ["Detailed analysis pending...", "Check author biography", "Research historical context"],
          whyRead: "This asset is recommended for serious academic inquiry."
        };
      }

      setAiAnalysisResult(aiJson);
      toast.success("Analysis Complete!", { icon: "✨" });
    } catch (err) {
      console.error("AI Analysis Error:", err);
      toast.error("Connection blocked. Check your connection.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const filteredBooks = booksData.filter(book => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "All" || book.category === selectedCategory;

    if (viewMode === "digital") {
      return matchesSearch && matchesCategory && book.pdfUrl;
    }
    return matchesSearch && matchesCategory;
  });

  const categories = ["All", ...new Set(booksData.map(b => b.category || "General"))];

  const handleReserve = async (bookId) => {
    try {
      const res = await fetch(`${API_URL}/api/reservations/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        credentials: 'include',
        body: JSON.stringify({ bookId })

      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error("Error reserving book");
    }
  };

  const handleToggleFavorite = async (bookId) => {
    try {
      const res = await fetch(`${API_URL}/api/auth/favorites/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`
        },
        credentials: 'include',
        body: JSON.stringify({ bookId })

      });
      const data = await res.json();
      if (res.ok) {
        setFavorites(data.favorites);
        toast.success("Favorites updated!");
      }
    } catch (err) {
      toast.error("Error updating favorites");
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100 pb-20 font-sans">

      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-8 pb-8 px-6">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Library Books</h1>
            <p className="text-slate-500 text-sm mt-1">Browse our collection of {booksData.length} curated resources.</p>
          </div>
          {isAdmin && (
            <button onClick={() => toast("Add Book")} className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-2 transition-colors">
              <FaPlus /> Add New Resource
            </button>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* Top Filters Bar */}
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
          
          {/* Big Search */}
          <div className="flex-1 relative w-full flex gap-3">
            <div className="relative flex-1">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
              <input
                type="text"
                placeholder="Search Books..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-12 pr-6 py-4 text-base font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('triggerAIAssistant', {
                  detail: { message: "Can you suggest some books from the catalog about " }
                }));
              }}
              className="px-6 py-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2"
            >
              <FaRobot size={18} /> AI Suggest
            </button>
          </div>

          <div className="flex gap-4 w-full md:w-auto items-center">
            {/* Format Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg h-full">
              <button 
                onClick={() => setViewMode('physical')} 
                className={`px-4 py-3 text-sm font-semibold rounded-md transition-all ${viewMode === 'physical' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Physical
              </button>
              <button 
                onClick={() => setViewMode('digital')} 
                className={`px-4 py-3 text-sm font-semibold rounded-md transition-all ${viewMode === 'digital' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Digital
              </button>
            </div>

            {/* Categories */}
            <div className="relative">
              <select
                className="w-full md:w-48 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold outline-none dark:text-white appearance-none cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

        </div>

        {/* Main Grid Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {selectedCategory === 'All' ? 'All Books' : selectedCategory} <span className="text-slate-400 text-sm font-normal">({filteredBooks.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse space-y-4">
                  <div className="bg-slate-200 dark:bg-slate-800 h-64 w-full rounded-xl"></div>
                  <div className="bg-slate-200 dark:bg-slate-800 h-4 w-3/4 rounded"></div>
                  <div className="bg-slate-200 dark:bg-slate-800 h-3 w-1/2 rounded"></div>
                </div>
              ))
            ) : filteredBooks.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-500">
                <FaBook className="mx-auto text-4xl mb-4 opacity-20" />
                <p>No books found matching your criteria.</p>
              </div>
            ) : filteredBooks.map((book) => (
              <motion.div 
                key={book._id || book.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col h-full hover:shadow-lg transition-shadow group"
              >
                {/* Clean Image Area */}
                <div className="relative h-64 bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer" onClick={() => book.pdfUrl && handleReadNow(book)}>
                  {book.coverUrl ? (
                    <img src={book.coverUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={book.title} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                      <FaBook size={48} />
                    </div>
                  )}
                  {/* Status Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-wide shadow-sm ${
                      book.status === 'Available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {book.status}
                    </span>
                    {book.pdfUrl && (
                      <span className="px-2 py-1 rounded-md text-[10px] font-bold tracking-wide shadow-sm bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        Digital
                      </span>
                    )}
                  </div>
                  
                  {/* Top Right Action (Favorite) */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleToggleFavorite(book._id || book.id); }}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      favorites.includes(book._id || book.id) ? "bg-rose-50 text-rose-500 shadow-sm" : "bg-white/80 text-slate-400 hover:bg-white hover:text-rose-500 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <FaHeart size={14} />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">{book.category || "General"}</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mb-1 line-clamp-2">{book.title}</h3>
                  <p className="text-slate-500 text-xs mb-4">by {book.author}</p>

                  <div className="mt-auto">
                    {/* Secondary Actions Row */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setReviewBook(book)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <FaStar className="text-amber-500" /> Reviews
                      </button>
                      <button
                        onClick={() => {
                          if (!user?.limits?.aiAnalysisAccess && user?.role !== 'admin') {
                            return toast.error("AI Analysis is restricted to Premium and Elite members. Please upgrade.");
                          }
                          handleAiAnalysis(book);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <FaRobot className="text-indigo-500" /> AI Guide
                      </button>
                    </div>

                    {/* Primary Action Button */}
                    {book.pdfUrl ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!user?.limits?.digitalAccess && user?.role !== 'admin') {
                              return toast.error("Digital Access is for Premium members only.");
                            }
                            handleReadNow(book);
                          }}
                          className={`flex-[3] py-2 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                            (!user?.limits?.digitalAccess && user?.role !== 'admin') ? "bg-slate-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                          }`}
                        >
                          <FaEye /> {(!user?.limits?.digitalAccess && user?.role !== 'admin') ? "Locked" : "Read Now"}
                        </button>
                        <button
                          onClick={() => handleDownload(book)}
                          className="flex-[1] flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <FaDownload size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleReserve(book._id || book.id)}
                        className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${
                          book.status === 'Available' 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                        }`}
                      >
                        {book.status === 'Available' ? 'Reserve Book' : 'Join Waitlist'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* 📖 IMMERSIVE DIGITAL READER MODAL */}
      <AnimatePresence>
        {readingBook && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col overflow-hidden"
          >
            {/* Reader Top Bar */}
            <div className="h-20 bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 sm:px-10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4 sm:gap-6 flex-1">
                <div className="w-10 h-14 bg-indigo-600/20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hidden sm:block relative">
                  {readingBook.coverUrl && <img src={readingBook.coverUrl} className="w-full h-full object-cover" />}
                  {isPlayingAudio && <div className="absolute inset-0 bg-indigo-500/20 mix-blend-overlay"></div>}
                </div>
                <div className="hidden sm:block">
                  <h3 className="text-xl font-black text-white tracking-tighter uppercase italic line-clamp-1">{readingBook.title}</h3>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest line-clamp-1">{readingBook.author} • Digital Mode</p>
                </div>
              </div>

              {/* Center spacer */}
              <div className="flex-1 flex justify-center"></div>

              <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
                {/* SIMPLE AUDIO UI */}
                <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl mr-2 border border-white/10">
                  <select 
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-transparent text-[11px] text-white font-bold outline-none cursor-pointer tracking-wider uppercase"
                  >
                    <option value="en" className="bg-slate-900">English</option>
                    <option value="hi" className="bg-slate-900">Hindi</option>
                    <option value="kn" className="bg-slate-900">Kannada</option>
                  </select>
                  <div className="w-px h-4 bg-white/20 mx-1"></div>
                  <button onClick={handleToggleAudio} disabled={isExtractingText || isPdfLoading} className="text-white hover:text-indigo-400 transition-colors disabled:text-slate-500">
                    {isExtractingText ? <FaSpinner className="animate-spin" size={16} /> : isPlayingAudio ? <FaPause size={16} /> : <FaPlay size={16} />}
                  </button>
                  {isPlayingAudio && (
                    <button onClick={handleStopAudio} className="text-white hover:text-rose-400 transition-colors">
                      <FaStop size={16} />
                    </button>
                  )}
                </div>

                <button onClick={() => handleDownload(readingBook)} className="p-3 sm:p-4 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-all" title="Download">
                  <FaCloudDownloadAlt size={20} />
                </button>
                <button onClick={() => { setReadingBook(null); setPdfBlobUrl(null); }} className="p-3 sm:p-4 bg-rose-600 text-white hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-500/20">
                  <FaTimesCircle size={20} />
                </button>
              </div>
            </div>

            {/* Reader Viewport */}
            <div className="flex-1 bg-[#0a0a0a] relative flex items-center justify-center p-4 sm:p-8">
              {isPdfLoading ? (
                <div className="flex flex-col items-center gap-6">
                  <FaSpinner className="text-indigo-500 animate-spin" size={60} />
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">Authenticating Secure Stream...</p>
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="w-full max-w-5xl h-full bg-white rounded-xl overflow-hidden shadow-md"
                >
                  <iframe
                    src={pdfBlobUrl || "about:blank"}
                    className="w-full h-full border-none"
                    title="Book Reader"
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GEMINI AI ANALYSIS MODAL */}
      {aiAnalysisBook && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-2xl animate-fadeIn">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden animate-proPop">
            <div className="h-40 bg-gradient-to-r from-indigo-600 to-purple-700 relative p-10 flex items-center gap-6">
              <div className="w-20 h-28 bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shrink-0 shadow-md">
                {aiAnalysisBook.coverUrl ? <img src={aiAnalysisBook.coverUrl} className="w-full h-full object-cover" /> : <FaBook className="m-auto text-white/50 h-full" size={32} />}
              </div>
              <div>
                <h3 className="text-2xl font-black text-white leading-tight">{aiAnalysisBook.title}</h3>
                <p className="text-indigo-200 text-sm font-medium mt-1">AI Summary</p>
              </div>
              <button onClick={() => setAiAnalysisBook(null)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-all"><FaTimes size={20} /></button>
            </div>

            <div className="p-10 space-y-8">
              {isAiAnalyzing ? (
                <div className="py-20 flex flex-col items-center gap-6">
                  <div className="relative">
                    <FaRobot size={64} className="text-indigo-600 animate-bounce" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-500 rounded-full animate-ping"></div>
                  </div>
                  <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">Analyzing book...</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Summary</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic">"{aiAnalysisResult?.summary}"</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Key Takeaways</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {aiAnalysisResult?.keyTakeaways.map((t, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-indigo-500/50 transition-all">
                          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-md shadow-indigo-500/20">{i + 1}</div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex items-start gap-4">
                    <FaRegLightbulb className="text-indigo-600 shrink-0 mt-1" />
                    <p className="text-xs text-indigo-900/70 dark:text-indigo-100/70 font-medium leading-relaxed">
                      {aiAnalysisResult?.whyRead}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="px-10 py-6 bg-slate-50 dark:bg-black/20 border-t border-slate-100 dark:border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AI Analysis</span>
              <button onClick={() => setAiAnalysisBook(null)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Book Reviews Modal */}
      {reviewBook && (
        <BookReviewsModal
          book={reviewBook}
          user={user}
          onClose={() => setReviewBook(null)}
        />
      )}
    </div>
  );
}
