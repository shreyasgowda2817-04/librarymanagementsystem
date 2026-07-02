import Workspace from "../models/workspace.js";
import Book from "../models/book.js";

// GET /api/workspaces
export const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ userId: req.user._id })
      .populate("linkedBooks", "title author coverImage")
      .sort({ lastAccessed: -1 });
    res.json(workspaces);
  } catch (err) {
    next(err);
  }
};

// GET /api/workspaces/:id
export const getWorkspaceById = async (req, res, next) => {
  try {
    const workspace = await Workspace.findOne({ _id: req.params.id, userId: req.user._id })
      .populate("linkedBooks", "title author coverImage category");
    
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    
    workspace.lastAccessed = Date.now();
    await workspace.save();
    
    res.json(workspace);
  } catch (err) {
    next(err);
  }
};

// POST /api/workspaces
export const createWorkspace = async (req, res, next) => {
  try {
    const { title, description, content, tags } = req.body;
    const workspace = await Workspace.create({
      userId: req.user._id,
      title: title || "Untitled Workspace",
      description,
      content,
      tags
    });
    res.status(201).json(workspace);
  } catch (err) {
    next(err);
  }
};

// PUT /api/workspaces/:id
export const updateWorkspace = async (req, res, next) => {
  try {
    const { title, description, content, tags } = req.body;
    const workspace = await Workspace.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, description, content, tags, lastAccessed: Date.now() },
      { new: true, runValidators: true }
    ).populate("linkedBooks", "title author coverImage");

    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    res.json(workspace);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/workspaces/:id
export const deleteWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });
    res.json({ message: "Workspace deleted" });
  } catch (err) {
    next(err);
  }
};

// POST /api/workspaces/:id/link-book
export const linkBookToWorkspace = async (req, res, next) => {
  try {
    const { bookId } = req.body;
    const workspace = await Workspace.findOne({ _id: req.params.id, userId: req.user._id });
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    // Ensure book exists
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (!workspace.linkedBooks.includes(bookId)) {
      workspace.linkedBooks.push(bookId);
      await workspace.save();
    }
    
    await workspace.populate("linkedBooks", "title author coverImage category");
    res.json(workspace);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/workspaces/:id/link-book/:bookId
export const unlinkBookFromWorkspace = async (req, res, next) => {
  try {
    const workspace = await Workspace.findOne({ _id: req.params.id, userId: req.user._id });
    if (!workspace) return res.status(404).json({ message: "Workspace not found" });

    workspace.linkedBooks = workspace.linkedBooks.filter(id => id.toString() !== req.params.bookId);
    await workspace.save();
    
    await workspace.populate("linkedBooks", "title author coverImage category");
    res.json(workspace);
  } catch (err) {
    next(err);
  }
};
