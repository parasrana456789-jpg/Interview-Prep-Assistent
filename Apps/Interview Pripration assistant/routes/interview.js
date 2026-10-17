import express from "express";
import InterviewQuestion from "../models/InterviewQuestion.js";

const router = express.Router();
router.get("/", (req, res) => {
  res.json({
    message: "Interview Route Working"
  });
});

router.post("/submit", async (req,res)=>{

const data = await InterviewQuestion.create(req.body);

res.json(data);

});

router.get("/history", async(req,res)=>{

const data =
await InterviewQuestion.find();

res.json(data);

});

export default router;