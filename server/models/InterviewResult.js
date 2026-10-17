const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['HR', 'Technical'], required: true },
    role: String,
    difficulty: String,
    durationSec: Number,
    answers: [{ question: String, answer: String, score: Number, feedback: String, idealAnswer: String, _id: false }],
    communicationScore: Number,
    confidenceScore: Number,
    technicalScore: Number,
    overallScore: Number,
    strengths: [String],
    improvements: [String],
    summary: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewResult', schema);
