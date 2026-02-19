import mongoose from "mongoose"

const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: true,
      trim: true,
      minLength: 1,
      maxLength: 250,
      required: true
    },
    category: {
      type: String,
      required: true
    },

  },
  {
    timestamps: true
  })


export const SkillModal = mongoose.model("Skills", SkillSchema);
