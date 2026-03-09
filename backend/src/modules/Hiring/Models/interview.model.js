import mongoose from "mongoose";

const InterviewSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicants",
      required: true,
    },
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rounds",
      required: true,
    },
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    feedback: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ["SCHEDULED", "COMPLETED", "CANCELED"],
        default: "SCHEDULED",
    },
     reviewDate: {
        type: Date,
        required: true,
    },
    grades:[
        {
            skillId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Skills",
                required: true,
            },
            score: {
                type: Number,
                min: 1,
                max: 5,
                required: true,
            },
        }

    ],
    result: {
        type: String,
        enum: ["PASSED", "FAILED", "PENDING"],
        default: "PENDING",
    }
  },
  {
    timestamps: true,
  },
);

const InterviewModel = mongoose.model("Interviews", InterviewSchema);
export default InterviewModel;
