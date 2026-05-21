import mongoose from "mongoose";

const SalariesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    userSnapshot: {
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
      profilePhoto: {
        type: String,
      },
      deptId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Departments",
      },
      deptName: {
        type: String,
        trim: true,
      },
    },

    base: {
      type: Number,
      required: true,
      min: 0,
    },

    hra: {
      type: Number,
      default: 0
    },

    lta: {
      type: Number,
      default: 0
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

SalariesSchema.index({ userId: 1 });
SalariesSchema.index({ "userSnapshot.deptId": 1 });



const SalariesModel = mongoose.model("Salaries", SalariesSchema);

export default SalariesModel
