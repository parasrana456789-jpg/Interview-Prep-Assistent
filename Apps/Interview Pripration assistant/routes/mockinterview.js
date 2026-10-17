import express from "express";
import MockInterview from "../models/MockInterview.js";

const router = express.Router();
router.get("/", (req, res) => {
  res.json({
    message: "Mock Interview Route Working"
  });
});

router.post("/submit", async(req,res)=>{

const data =
await MockInterview.create(req.body);

res.json(data);

});

router.get("/history", async(req,res)=>{

const data =
await MockInterview.find();

res.json(data);

});

export default router;