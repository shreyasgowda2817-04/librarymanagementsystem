import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: "Untitled Workspace",
    },
    description: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "", // Stores markdown or rich text content of the workspace
    },
    linkedBooks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
    tags: [
      {
        type: String,
      },
    ],
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Workspace = mongoose.model("Workspace", workspaceSchema);
export default Workspace;
