import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true
  },

  phone: String,

  college: String,

  skills: String,

  bio: String,

  createdAt: {
    type: Date,
    default: Date.now
  }

});

export default mongoose.model(
  "Profile",
  profileSchema
);