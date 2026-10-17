import mongoose from "mongoose";

const mockSchema = new mongoose.Schema({
  role: String,
  difficulty: String,
  type: String,
  score: Number,
  feedback: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model(
  "MockInterview",
  mockSchema
);