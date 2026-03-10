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
