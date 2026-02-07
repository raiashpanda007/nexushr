import mongoose, { Error } from "mongoose";



const LeaveRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true
    },
    types: [
      {
        type: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "LeaveTypes",
          required: true,
        },
        quantity: {
          type: Number,
          required: true
        }
      }
    ],
    from: {
      type: Date,
      default: Date.now(),
      required: true,
    },
    to: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ["PENDING", "REJECTED", "ACCEPTED"]
    }

  },
  {
    timestamps: true
  }
)



LeaveRequestSchema.index({ requestedBy: 1 });
LeaveRequestSchema.index({ respondedBy: 1 });
LeaveRequestSchema.index({ status: 1 });
LeaveRequestSchema.index({ from: 1 });
LeaveRequestSchema.index({ to: 1 });




LeaveRequestSchema.pre("save", function(next) {
  if (!this.isModified("from") && !this.isModified("to")) return next();
  try {
    const fromDate = new Date(this.from);
    const toDate = new Date(this.to);
    if (fromDate.getTime() > toDate.getTime()) {
      const err = new Error("From can't be greater than to");
      return next(err);
    }
    next();
  } catch (e) {
    next(e);
  }
})



export const LeaveRequestModel = mongoose.model("LeaveRequests", LeaveRequestSchema);
