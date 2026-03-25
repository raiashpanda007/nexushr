import mongoose from "mongoose";

const AssessmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    questions: [
      {
        question: {
          type: String,
          required: true,
          trim: true
        },
        type: {
          type: String,
          enum: ["MCQ", "TEXT"],
          default: "MCQ"
        },
        options: [
          {
            type: String,
            trim: true
          }
        ],
        correctAnswer: {
          type: String,
          trim: true
        },
        marks: {
          type: Number,
          default: 1,
          min: 1
        }
      }
    ],
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      default: null
    },
    // legacy field — kept for backward compat
    score: {
      type: Number
    }
  },
  {
    timestamps: true,
  }
);

const AssesmentModel = mongoose.model("Assesments", AssessmentSchema);

export default AssesmentModel;
