const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    personal: {
      name: String,
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
      portfolio: String,
      summary: String,
    },
    education: [{ institution: String, degree: String, field: String, startYear: String, endYear: String, grade: String, _id: false }],
    skills: [String],
    projects: [{ name: String, tech: String, link: String, description: String, _id: false }],
    certifications: [{ name: String, issuer: String, year: String, _id: false }],
    experience: [{ company: String, role: String, startDate: String, endDate: String, description: String, _id: false }],
    achievements: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);
