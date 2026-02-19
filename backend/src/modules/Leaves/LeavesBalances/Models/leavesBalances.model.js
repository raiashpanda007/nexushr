import mongoose from "mongoose";

const LeaveBalanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      unique: true
    },

    leaves: [
      {
        type: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LeaveTypes",
          required: true
        },
        amount: {
          type: Number,
          default: 0,
          min: 0
        }
      }
    ]
  },
  { timestamps: true }
);

LeaveBalanceSchema.index({ user: 1 });

const LeaveBalanceModel = mongoose.model(
  "LeaveBalance",
  LeaveBalanceSchema
);

export default LeaveBalanceModel;