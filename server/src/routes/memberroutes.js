// server/src/routes/memberRoutes.js
import express from "express";
import {
  getMembers,
  createMember,
  updateMember,
  deleteMember
} from "../controllers/memberController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").get(protect, admin, getMembers).post(protect, admin, createMember);

router.route("/:id").put(protect, admin, updateMember).delete(protect, admin, deleteMember);


export default router;
