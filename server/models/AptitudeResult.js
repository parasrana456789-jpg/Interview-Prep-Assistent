const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    role: String,
    difficulty: String,
    totalQuestions: Number,
    correct: Number,
    score: Number, // percentage 0-100
    timeTaken: Number, // seconds
    timeLimit: Number,
    topicBreakdown: [{ topic: String, total: Number, correct: Number, _id: false }],
    analysis: String,
    questions: [
      {
        question: String,
        options: [String],
        selected: Number,
        correct: Number,
        topic: String,
        explanation: String,
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('AptitudeResult', schema);
