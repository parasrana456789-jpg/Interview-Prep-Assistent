
import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
{
    language: {
        type: String,
        required: true
    },

    question: {
        type: String,
        required: true
    },

    code: {
        type: String,
        required: true
    },

    score: {
        type: Number,
        default: 0
    },

    status: {
        type: String,
        default: "Pending"
    },

    difficulty: {
        type: String,
        default: "Easy"
    },

    feedback: {
        type: String,
        default: ""
    },

    correctSolution: {
        type: String,
        default: ""
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Score", scoreSchema);

