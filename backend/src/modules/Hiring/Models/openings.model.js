import mongoose from "mongoose";
import Users from "../../Users/models/users.models.js";

const OpeningSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Departments",
      required: true,
    },

    skills: [
      {
        skillId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Skills",
          required: true,
        },
        proficiencyLevel: {
          type: Number,
          min: 1,
          max: 5,
          required: true,
        },
      },
    ],
    HiringManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    Status: {
      type: String,
      enum: ["OPEN", "CLOSED", "PAUSED"],
      default: "OPEN",
    },

    note: {
      type: String,
      trim: true,
    },
    applicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Applicants",
      },
    ],
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Questions",
      },
    ],
    rounds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Rounds",
      },
    ],
    expectedJoiningDate: {
      type: Date,
    },
    salaryRange: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

OpeningSchema.pre("save", async function () {
  if (this.isModified("HiringManager") || this.isModified("departmentId")) {
    const manager = await Users.findById(this.HiringManager)
      .select("deptId")
      .lean();
    if (!manager) {
      throw new Error("Hiring Manager not found");
    }
    if (manager.deptId?.toString() !== this.departmentId?.toString()) {
      throw new Error(
        "Hiring Manager does not belong to the selected department",
      );
    }
  }
});

const Openings = mongoose.model("Openings", OpeningSchema);

export default Openings;
