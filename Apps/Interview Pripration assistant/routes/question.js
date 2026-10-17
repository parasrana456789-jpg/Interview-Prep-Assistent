
import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const genAI = new GoogleGenerativeAI(
process.env.GEMINI_API_KEY
);
router.get("/", (req, res) => {
  res.json({
    message: "Question Route Working"
  });
});

router.post("/generate", async (req, res) => {
   // question generation code
});

router.post("/", async (req, res) => {
    try {

        const { language, difficulty } = req.body;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const prompt = `
Generate one ${difficulty} coding interview question for ${language}.

Return only:
Question
Difficulty
Sample Input
Sample Output
`;

        const result =
        await model.generateContent(prompt);

        const response =
        result.response.text();

        res.json({
            success: true,
            question: response
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
});

export default router;

