import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
  role: String,
  difficulty: String,
  question: String,
  answer: String,
  score: Number,
  feedback: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(
  "InterviewQuestion",
  interviewSchema
);