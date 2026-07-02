import express from "express";
import { addReview, getBookReviews } from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addReview);
router.get("/book/:bookId", protect, getBookReviews);

export default router;
