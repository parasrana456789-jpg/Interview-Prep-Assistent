const mongoose = require('mongoose');

const CATEGORIES = ['Java', 'Python', 'DSA', 'DBMS', 'Operating System', 'Computer Networks', 'HR'];

const questionSchema = new mongoose.Schema(
  {
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);
questionSchema.index({ question: 'text', answer: 'text' });

module.exports = mongoose.model('Question', questionSchema);
module.exports.CATEGORIES = CATEGORIES;
