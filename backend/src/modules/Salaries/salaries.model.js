import mongoose from "mongoose";

const SalariesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

SalariesSchema.index({ userId: 1 });



export const SalariesModel = mongoose.model("Salaries", SalariesSchema);
