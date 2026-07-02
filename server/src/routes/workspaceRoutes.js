import express from "express";
import {
  getWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  linkBookToWorkspace,
  unlinkBookFromWorkspace
} from "../controllers/workspaceController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect); // All workspace routes require authentication

router.route("/")
  .get(getWorkspaces)
  .post(createWorkspace);

router.route("/:id")
  .get(getWorkspaceById)
  .put(updateWorkspace)
  .delete(deleteWorkspace);

router.post("/:id/link-book", linkBookToWorkspace);
router.delete("/:id/link-book/:bookId", unlinkBookFromWorkspace);

export default router;
