const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    avatar: { type: String, default: '' }, // small JPEG/PNG data-URL kept in MongoDB so it survives Render's ephemeral disk
    fullName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    dob: Date,
    gender: { type: String, enum: ['', 'Male', 'Female', 'Other', 'Prefer not to say'], default: '' },
    college: { type: String, trim: true, default: '' },
    degree: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
    semester: { type: Number, min: 1, max: 12 },
    skills: { type: [String], default: [] },
    linkedin: { type: String, trim: true, default: '' },
    github: { type: String, trim: true, default: '' },
    portfolio: { type: String, trim: true, default: '' },
    careerGoal: { type: String, trim: true, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Profile', profileSchema);
