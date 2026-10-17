
import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Score from "../models/Score.js";

const router = express.Router();

const genAI = new GoogleGenerativeAI(
process.env.GEMINI_API_KEY
);

router.post("/", async (req, res) => {

try {

const {
language,
question,
code
} = req.body;

/* Judge0 Run */

const judgeResponse =
await axios.post(
process.env.JUDGE0_URL,
{
source_code: code,
language_id: 62
},
{
headers: {
"X-RapidAPI-Key":
process.env.JUDGE0_API_KEY
}
}
);

const output =
judgeResponse.data.stdout || "";

const compileError =
judgeResponse.data.compile_output || "";

const runtimeError =
judgeResponse.data.stderr || "";

/* Gemini Evaluation */

const model =
genAI.getGenerativeModel({
model: "gemini-2.5-flash"
});

const prompt = `
Question:
${question}

Language:
${language}

Code:
${code}

Output:
${output}

Compile Error:
${compileError}

Runtime Error:
${runtimeError}

Evaluate:
1. Correctness
2. Logic
3. Code Quality
4. Time Complexity

Return JSON:

{
"score":90,
"status":"Correct",
"difficulty":"Medium",
"feedback":"Good work",
"correctSolution":"..."
}
`;

const result =
await model.generateContent(prompt);

const aiResponse =
result.response.text();

let evaluation;

try {

evaluation =
JSON.parse(
aiResponse.replace(/```json|```/g,"")
);

} catch {

evaluation = {
score: 70,
status: "Checked",
difficulty: "Medium",
feedback: aiResponse,
correctSolution: ""
};

}

/* Save MongoDB */

const saved =
await Score.create({

language,
question,
code,

score:
evaluation.score,

status:
evaluation.status,

difficulty:
evaluation.difficulty,

feedback:
evaluation.feedback,

correctSolution:
evaluation.correctSolution

});

res.json({

success: true,

output,
compileError,
runtimeError,

evaluation,

saved

});

} catch (error) {

res.status(500).json({

success: false,
message: error.message

});

}

});

export default router;

