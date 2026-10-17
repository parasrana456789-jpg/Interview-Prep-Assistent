import express from "express";
import User from "../models/User.js";
import AptitudeResult from "../models/AptitudeResult.js";
import CodingResult from "../models/CodingResult.js";

const router = express.Router();

router.get("/", async (req, res) => {

  try {

    const totalUsers = await User.countDocuments();

    const aptitudeTests =
      await AptitudeResult.countDocuments();

    const codingTests =
      await CodingResult.countDocuments();

    res.json({
      success: true,
      totalUsers,
      aptitudeTests,
      codingTests
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

export default router;