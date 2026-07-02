import Review from "../models/Review.js";
import Book from "../models/book.js";
import { awardPoints } from "../utils/gamification.js";

// Add a new review
export const addReview = async (req, res, next) => {
  try {
    const { bookId, rating, reviewText } = req.body;
    const userId = req.user._id;

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    // Check if user already reviewed this book
    const existing = await Review.findOne({ bookId, userId });
    if (existing) {
      existing.rating = rating;
      existing.reviewText = reviewText;
      await existing.save();
      return res.status(200).json(existing);
    }

    const review = await Review.create({
      bookId,
      userId,
      rating,
      reviewText
    });

    // Award points for review
    await awardPoints(userId, 15);

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
};

// Get reviews for a specific book
export const getBookReviews = async (req, res, next) => {
  try {
    const { bookId } = req.params;
    const reviews = await Review.find({ bookId })
      .populate("userId", "name profilePhoto")
      .sort({ createdAt: -1 });

    // Calculate average rating
    let avgRating = 0;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, rev) => acc + rev.rating, 0);
      avgRating = (sum / reviews.length).toFixed(1);
    }

    res.json({ reviews, avgRating, totalReviews: reviews.length });
  } catch (err) {
    next(err);
  }
};
