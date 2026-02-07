import mongoose from "mongoose";




const LeaveBalanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    leaves: [
      {
        types: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LeaveTypes",
          required: true,
        },
        amount: {
          type: Number,
          default: 0,
        }
      }
    ]
  },
  {
    timestamps: true
  }
)



export const LeaveBalanceModel = mongoose.Model("LeaveBalance", LeaveBalanceSchema)
