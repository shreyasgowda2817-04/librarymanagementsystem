import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaTimes, FaSpinner, FaRegStar } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function BookReviewsModal({ book, user, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // New Review State
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (book) fetchReviews();
  }, [book]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/book/${book._id || book.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setAvgRating(data.avgRating || 0);
      }
    } catch (err) {
      console.error("Error fetching reviews:", err);
      toast.error("Failed to load reviews.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) return toast.error("Please select a star rating!");
    if (!reviewText.trim()) return toast.error("Please write a review comment!");

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}` 
        },
        credentials: 'include',
        body: JSON.stringify({
          bookId: book._id || book.id,
          rating,
          reviewText
        })
      });

      if (res.ok) {
        toast.success("Review submitted! +15 Points", { icon: "⭐" });
        setRating(0);
        setReviewText("");
        fetchReviews(); // Refresh list
      } else {
        const errData = await res.json();
        toast.error(errData.message || "Failed to submit review.");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Network error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!book) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">{book.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex text-amber-500 text-sm">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} className={i < Math.round(avgRating) ? "text-amber-500" : "text-slate-300 dark:text-slate-700"} />
                  ))}
                </div>
                <span className="text-sm font-medium text-slate-500">{avgRating} out of 5 ({reviews.length} reviews)</span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
              <FaTimes />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
            
            {/* Write Review Section */}
            <div className="mb-8 p-5 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      {star <= (hoverRating || rating) ? (
                        <FaStar className="text-amber-500" />
                      ) : (
                        <FaRegStar className="text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                  ))}
                </div>
                <textarea 
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your thoughts about this book..."
                  className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none h-24"
                />
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? <FaSpinner className="animate-spin" /> : 'Post Review'}
                  </button>
                </div>
              </form>
            </div>

            {/* Reviews List */}
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Community Reviews</h3>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <FaSpinner className="animate-spin text-indigo-500 text-2xl" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-slate-500 text-sm">No reviews yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {rev.userId?.profilePhoto ? (
                          <img src={rev.userId.profilePhoto} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                            {rev.userId?.name?.charAt(0) || "U"}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{rev.userId?.name || "Anonymous User"}</p>
                          <p className="text-[11px] text-slate-500 mt-1">{new Date(rev.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex text-amber-500 text-xs">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < rev.rating ? "text-amber-500" : "text-slate-200 dark:text-slate-800"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">{rev.reviewText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
