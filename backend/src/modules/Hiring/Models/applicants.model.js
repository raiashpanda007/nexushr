import mongoose from "mongoose";

const ApplicantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    resume: {
      type: String,
      required: true,
    },
    openingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Openings",
      required: true,
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
    status: {
      type: String,
      enum: ["APPLIED", "INTERVIEWING", "OFFERED", "OFFERING", "REJECTED"],
      default: "APPLIED",
    },
    questions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Questions",
          required: true,
        },
        answer: {
          type: String,
          trim: true,
        },
      },
    ],
    note: {
      type: String,
      trim: true,
    },
    currentRound: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Rounds",
    },
    currentRoundSnapshot: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rounds",
      },
      name: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      type: {
        type: String,
        enum: ["INTERVIEW", "TEST", "ASSIGNMENT"],
      },
      rank: {
        type: Number,
        min: 1,
      },
    },
    score: {
      type: Number,
    },
  },

  {
    timestamps: true,
  },
);

ApplicantSchema.index({ email: 1, openingId: 1 }, { unique: true });
ApplicantSchema.index({ phone: 1, openingId: 1 }, { unique: true });
ApplicantSchema.index({ openingId: 1 });

const ApplicantModel = mongoose.model("Applicants", ApplicantSchema);
export default ApplicantModel;
