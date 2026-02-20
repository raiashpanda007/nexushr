import mongoose from "mongoose";

const SalariesSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
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
    timestamps: { createdAt: true, updatedAt: false }
  }
);

SalariesSchema.index({ userId: 1 });



const SalariesModel = mongoose.model("Salaries", SalariesSchema);

export default SalariesModel
