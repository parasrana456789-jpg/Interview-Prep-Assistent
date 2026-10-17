import express from "express";
import Resume from "../models/Resume.js";

const router = express.Router();

router.post("/save", async(req,res)=>{

const data =
await Resume.create(req.body);

res.json(data);

});

router.get("/all", async(req,res)=>{

const data =
await Resume.find();

res.json(data);

});

export default router;