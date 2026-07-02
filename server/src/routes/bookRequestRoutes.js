import express from "express";
import { createRequest, getMyRequests, getAllRequests, updateRequestStatus, deleteRequest } from "../controllers/bookRequestController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createRequest);
router.get("/my", protect, getMyRequests);
router.get("/all", protect, admin, getAllRequests);
router.put("/:id/status", protect, admin, updateRequestStatus);
router.delete("/:id", protect, deleteRequest);

export default router;
