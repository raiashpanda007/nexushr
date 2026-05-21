import mongoose from "mongoose";

const LeaveBalanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      unique: true
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

    leaves: [
      {
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
LeaveBalanceSchema.index({ "leaves.type": 1, user: 1 }, { unique: true });
LeaveBalanceSchema.index({ "userSnapshot.deptId": 1 });
LeaveBalanceSchema.index({ "leaves.typeSnapshot.name": 1 });

const LeaveBalanceModel = mongoose.model(
  "LeaveBalance",
  LeaveBalanceSchema
);

export default LeaveBalanceModel;