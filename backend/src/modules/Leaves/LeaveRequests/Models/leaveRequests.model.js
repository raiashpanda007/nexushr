import mongoose, { Error } from "mongoose";
import LeaveBalanceModel from "../../LeavesBalances/Models/leavesBalances.model.js";


const LeaveRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true
    },

    requestedBySnapshot: {
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

    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    },

    respondedBySnapshot: {
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

    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveTypes",
      required: true
    },

    typeSnapshot: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LeaveTypes",
      },
      name: {
        type: String,
        trim: true,
      },
      code: {
        type: String,
        trim: true,
      },
      length: {
        type: String,
        enum: ["HALF", "FULL"],
      },
      isPaid: {
        type: Boolean,
      },
    },

    quantity: {
      type: Number,
      required: true,
      min: 1
    },

    from: {
      type: Date,
      required: true
    },

    to: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["PENDING", "REJECTED", "ACCEPTED"],
      default: "PENDING"
    }
  },
  { timestamps: true }
);


LeaveRequestSchema.index({ requestedBy: 1 });
LeaveRequestSchema.index({ respondedBy: 1 });
LeaveRequestSchema.index({ status: 1 });
LeaveRequestSchema.index({ from: 1, to: 1 });
LeaveRequestSchema.index({ "requestedBySnapshot.deptId": 1 });
LeaveRequestSchema.index({ "typeSnapshot.name": 1 });




LeaveRequestSchema.pre("save", async function () {
  if (!this.isNew) return;

  const fromDate = new Date(this.from);
  const toDate = new Date(this.to);

  if (fromDate > toDate) {
    throw new Error("From date cannot be greater than To date");
  }

  const ONE_DAY = 24 * 60 * 60 * 1000;
  const diffDays =
    Math.floor((toDate.getTime() - fromDate.getTime()) / ONE_DAY) + 1;

  if (diffDays !== this.quantity) {
    throw new Error(`Quantity must match ${diffDays} days`);
  }


  const balance = await LeaveBalanceModel.findOne({
    user: this.requestedBy,
    "leaves.type": this.type
  });

  if (!balance) {
    throw new Error("No leave balance found for this type");
  }

  const leaveEntry = balance.leaves.find(
    l => l.type.toString() === this.type.toString()
  );

  if (!leaveEntry || leaveEntry.amount < this.quantity) {
    throw new Error("Insufficient leave balance");
  }
});


const LeaveRequestModel = mongoose.model(
  "LeaveRequests",
  LeaveRequestSchema
);

export default LeaveRequestModel;