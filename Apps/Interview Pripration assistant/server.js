import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import questionRoute from "./routes/question.js";
import submitRoute from "./routes/submit.js";
import progressRoute from "./routes/progress.js";
import aptitudeRoute from "./routes/aptitude.js";
import interviewRoute from "./routes/interview.js";
import mockInterviewRoute from "./routes/mockinterview.js";
import resumeRoute from "./routes/resume.js";
import authRoute from "./routes/auth.js";
import dashboardRoute from "./routes/dashboard.js";
import profileRoute from "./routes/profile.js";

dotenv.config();

console.log("Gemini Key:",
  process.env.GEMINI_API_KEY);


const app = express();

/* Middleware */

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
  extended: true
}));

/* MongoDB Connection */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.log(err);
  });

/* Routes */

app.use("/api/question", questionRoute);

app.use("/api/submit", submitRoute);

app.use("/api/progress", progressRoute);

app.use("/api/aptitude", aptitudeRoute);

app.use("/api/interview", interviewRoute);

app.use("/api/mock", mockInterviewRoute);

app.use("/api/resume", resumeRoute);

app.use("/api/auth", authRoute);

app.use("/api/dashboard", dashboardRoute);

app.use("/api/profile", profileRoute);

/* Home Route */

app.get("/", (req, res) => {
  res.send("Interview Preparation Assistant API Running");
});

/* Server */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});