import dotenv from "dotenv";
dotenv.config();

console.log("Aptitude Key:", process.env.GEMINI_API_KEY);
import express from "express";
import AptitudeResult from "../models/AptitudeResult.js";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

/* Generate Questions */
router.get("/", (req, res) => {
  res.json({
    message: "Aptitude Route Working"
  });
});

router.post("/generate", async (req, res) => {

  try {

    const { role, difficulty } = req.body;

    const prompt = `
Generate 10 Aptitude MCQ questions.

Role: ${role}
Difficulty: ${difficulty}

Return ONLY valid JSON.

Example:

[
 {
  "question":"What is 20% of 150?",
  "options":["20","25","30","35"],
  "answer":"30"
 }
]
`;

    const response =
      await ai.models.generativeModel({
        model: "gemini-2.0-flash",
        contents: prompt
      });

    const text = response.text.trim();

    const questions = JSON.parse(text);

    res.json(questions);

  } catch (error) {
    console.error("Aptitude Error:")
    console.error(error);


    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

/* Submit Test */

router.post("/submit", async (req, res) => {

  try {

    const {
      role,
      difficulty,
      score,
      totalQuestions,
      answers
    } = req.body;

    const result =
      await AptitudeResult.create({

        role,
        difficulty,

        score,
        totalQuestions,

        answers

      });

    res.json({
      success: true,
      result
    });

  } catch (error) {

    console.error("Aptitude Error:", error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

/* History */

router.get("/history", async (req, res) => {

  try {

    const data =
      await AptitudeResult
        .find()
        .sort({ createdAt: -1 });

    res.json(data);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

/* Report */

router.get("/report", async (req, res) => {

  try {

    const tests =
      await AptitudeResult.find();

    const totalTests =
      tests.length;

    const totalScore =
      tests.reduce(
        (sum, item) => sum + item.score,
        0
      );

    const averageScore =
      totalTests > 0
        ? Math.round(
            totalScore / totalTests
          )
        : 0;

    res.json({
      totalTests,
      averageScore
    });

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});

export default router;