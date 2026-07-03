// server/src/routes/bookRoutes.js
import express from "express";
import {
  getBooks,
  createBook,
  updateBook,
  deleteBook,
  readPdf,
  getMedia
} from "../controllers/bookController.js";
import { protect } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.route("/").get(protect, getBooks).post(
  protect,
  upload.fields([{ name: "pdf", maxCount: 1 }, { name: "cover", maxCount: 1 }]),
  createBook
);

router.route("/read/:id").get(protect, readPdf);

router.route("/:id")
  .put(protect, upload.fields([{ name: "pdf", maxCount: 1 }, { name: "cover", maxCount: 1 }]), updateBook)
  .delete(protect, deleteBook);

router.route("/media/:id").get(getMedia);

export default router;
