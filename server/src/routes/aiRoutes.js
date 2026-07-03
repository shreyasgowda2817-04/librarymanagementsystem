import express from "express";
import { chatWithAI, analyzeBook, getDashboardSummary, aiExplore, semanticSearch } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected route: Only logged-in users can chat with AI
router.post("/chat", protect, chatWithAI);
router.post("/analyze", protect, analyzeBook);
router.get("/dashboard-summary", protect, getDashboardSummary);
router.post("/explore", protect, aiExplore);
router.post("/semantic-search", protect, semanticSearch);

export default router;
