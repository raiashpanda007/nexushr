import mongoose from "mongoose";

const InterviewSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Applicants",
      required: true,
    },
    applicantSnapshot: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Applicants",
      },
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
    },
    roundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rounds",
      required: true,
    },
    roundSnapshot: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rounds",
      },
      name: {
        type: String,
        trim: true,
      },
      type: {
        type: String,
        enum: ["INTERVIEW", "TEST", "ASSIGNMENT"],
      },
      description: {
        type: String,
        trim: true,
      },
      rank: {
        type: Number,
        min: 1,
      },
    },
    reviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
        required: true,
      },
    ],
    reviewersSnapshot: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Users",
        },
        firstName: {
          type: String,
          trim: true,
        },
        lastName: {
          type: String,
          trim: true,
        },
        email: {
          type: String,
          lowercase: true,
          trim: true,
        },
      },
    ],
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
    grades: [
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
      },
    ],
    result: {
      type: String,
      enum: ["PASSED", "FAILED", "PENDING"],
      default: "PENDING",
    },
    openingSnapshot: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Openings",
      },
      title: {
        type: String,
        trim: true,
      },
      departmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Departments",
      },
      departmentName: {
        type: String,
        trim: true,
      },
      hiringManagerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
      hiringManagerName: {
        type: String,
        trim: true,
      },
      hiringManagerEmail: {
        type: String,
        lowercase: true,
        trim: true,
      },
    },
    zoomMeetingId: {
      type: String,
    },
    zoomJoinUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

InterviewSchema.index({ applicantId: 1, roundId: 1 }, { unique: true });

const InterviewModel = mongoose.model("Interviews", InterviewSchema);
export default InterviewModel;
