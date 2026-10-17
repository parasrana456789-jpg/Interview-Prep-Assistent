const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: String,
    description: String,
    topic: String,
    difficulty: String,
    language: String,
    code: String,
    testsPassed: Number,
    testsTotal: Number,
    correctness: Number, // % of test cases passed
    score: Number, // 70% correctness + 30% code quality
    timeComplexity: String,
    spaceComplexity: String,
    suggestions: [String],
    feedback: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('CodingResult', schema);
