import mongoose from "mongoose";

const aptitudeSchema = new mongoose.Schema({
  role: String,
  difficulty: String,

  score: Number,
  totalQuestions: Number,

  answers: [
    {
      question: String,
      selectedAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(
  "AptitudeResult",
  aptitudeSchema
);