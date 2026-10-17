import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({

  name: String,
  email: String,
  phone: String,

  linkedin: String,
  github: String,

  objective: String,

  education: String,

  skills: String,

  projects: String,

  internships: String,

  certificates: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model(
  "Resume",
  resumeSchema
);