import mongoose from "mongoose";

const codingResultSchema = new mongoose.Schema({

  question: String,

  code: String,

  language: String,

  score: Number,

  feedback: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model(
  "CodingResult",
  codingResultSchema
);