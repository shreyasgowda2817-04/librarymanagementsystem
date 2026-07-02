import mongoose from 'mongoose';

const messageTemplateSchema = new mongoose.Schema({
  templateId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  }
}, { timestamps: true });

export default mongoose.model('MessageTemplate', messageTemplateSchema);
