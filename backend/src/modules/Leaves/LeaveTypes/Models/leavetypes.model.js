import mongoose from "mongoose";

const LeaveTypeSchema = new mongoose.Schema(
  {
    name:
    {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 200
    },
    code: {
      type: String,
      required: true,
      minLength: 1,
      maxLength: 5,
      unique: true
    },
    length: {
      type: String,
      enum: ["HALF", "FULL"],
      default: "HALF"

    },
    isPaid: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

const LeaveTypeModal = mongoose.model("LeaveTypes", LeaveTypeSchema);


export default LeaveTypeModal