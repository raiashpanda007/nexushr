import { ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";
import mongoose from "mongoose";

const PunchSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
    photo: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const AttendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    punches: {
      type: [PunchSchema],
      default: [],
    },

    totalMinutes: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });


AttendanceSchema.pre("save", function () {
  if (this.punches.length === 0) return;

  const lastPunch = this.punches[this.punches.length - 1];

  if (lastPunch.type === "OUT") {
    const firstIn = this.punches.find(p => p.type === "IN");

    if (!firstIn) {
      throw new ApiError(Types.Errors.BadRequest, "Cannot punch OUT without any IN");
    }

    const lastOut = lastPunch.time;

    const diffMinutes =
      (lastOut.getTime() - firstIn.time.getTime()) / 60000;

    if (diffMinutes < 0) {
      throw new ApiError(Types.Errors.BadRequest, "OUT time cannot be before IN time");
    }

    this.totalMinutes = Math.floor(diffMinutes);
  }
});

const AttendanceModel = mongoose.model("Attendance", AttendanceSchema);

export default AttendanceModel;