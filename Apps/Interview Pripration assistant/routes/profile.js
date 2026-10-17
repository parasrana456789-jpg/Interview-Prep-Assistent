import express from "express";
import Profile from "../models/Profile.js";

const router = express.Router();

/* Save Profile */

router.post("/save", async (req, res) => {

  try {

    const profile =
      await Profile.create(req.body);

    res.json({
      success: true,
      profile
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

/* Get Profile */

router.get("/", async (req, res) => {

  try {

    const profile =
      await Profile.findOne()
      .sort({ createdAt: -1 });

    res.json(profile);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

});

export default router;