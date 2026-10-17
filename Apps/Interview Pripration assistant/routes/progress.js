import express from "express";

import AptitudeResult from "../models/AptitudeResult.js";
import CodingResult from "../models/CodingResult.js";
import InterviewQuestion from "../models/InterviewQuestion.js";
import MockInterview from "../models/MockInterview.js";
import Resume from "../models/Resume.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {

    const aptitude = await AptitudeResult.find();
    const coding = await CodingResult.find();
    const interview = await InterviewQuestion.find();
    const mock = await MockInterview.find();
    const resume = await Resume.find();

    // Aptitude Average
    const aptitudeAverage =
      aptitude.length > 0
        ? Math.round(
            aptitude.reduce(
              (sum, item) => sum + item.score,
              0
            ) / aptitude.length
          )
        : 0;

    // Coding Average
    const codingAverage =
      coding.length > 0
        ? Math.round(
            coding.reduce(
              (sum, item) => sum + item.score,
              0
            ) / coding.length
          )
        : 0;

    // Mock Average
    const mockAverage =
      mock.length > 0
        ? Math.round(
            mock.reduce(
              (sum, item) => sum + item.score,
              0
            ) / mock.length
          )
        : 0;

    const overallScore =
      Math.round(
        (
          aptitudeAverage +
          codingAverage +
          mockAverage
        ) / 3
      );

    const activities = [];

    aptitude.forEach(item => {
      activities.push({
        module: "Aptitude",
        result: "Completed",
        score: `${item.score}/${item.totalQuestions}`,
        date: item.createdAt
      });
    });

    coding.forEach(item => {
      activities.push({
        module: "Coding",
        result: "Solved",
        score: `${item.score}/100`,
        date: item.createdAt
      });
    });

    interview.forEach(item => {
      activities.push({
        module: "Interview Question",
        result: "Attempted",
        score: `${item.score}/100`,
        date: item.createdAt
      });
    });

    mock.forEach(item => {
      activities.push({
        module: "Mock Interview",
        result: "Completed",
        score: `${item.score}/100`,
        date: item.createdAt
      });
    });

    res.json({
      totalTests:
        aptitude.length +
        coding.length +
        interview.length +
        mock.length,

      overallScore,

      aptitudeScore: aptitudeAverage,
      codingScore: codingAverage,
      mockScore: mockAverage,

      codingSolved: coding.length,

      mockInterviews: mock.length,

      interviewQuestions:
        interview.length,

      resumeGenerated:
        resume.length > 0,

      activities
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: error.message
    });

  }
});

export default router;