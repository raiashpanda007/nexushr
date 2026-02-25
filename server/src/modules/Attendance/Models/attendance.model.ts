import mongoose from "mongoose";
import type {
  HydratedDocument,
  Model,
  Types as MongooseTypes,
} from "mongoose";
import { ApiError } from "../../../utils";
import Types from "../../../types";

type PunchType = "IN" | "OUT";

interface Punch {
  type: PunchType;
  time: Date;
}

interface Attendance {
  user: MongooseTypes.ObjectId;
  date: Date;
  punches: Punch[];
  totalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

type AttendanceDocument = HydratedDocument<Attendance>;
type AttendanceModelType = Model<Attendance>;

const PunchSchema = new mongoose.Schema<Punch>(
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
  },
  { _id: false }
);

const AttendanceSchema = new mongoose.Schema<Attendance, AttendanceModelType>(
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

AttendanceSchema.pre("save", function preSave(this: AttendanceDocument) {
  if (this.punches.length === 0) {
    return;
  }

  const lastPunch = this.punches[this.punches.length - 1];

  if (!lastPunch) {
    return;
  }

  if (lastPunch.type === "OUT") {
    const firstIn = this.punches.find((punch) => punch.type === "IN");

    if (!firstIn) {
      throw new ApiError(
        Types.StatusCodes.BadRequest,
        "Cannot punch OUT without any IN"
      );
    }

    const diffMinutes = (lastPunch.time.getTime() - firstIn.time.getTime()) / 60000;

    if (diffMinutes < 0) {
      throw new ApiError(
        Types.StatusCodes.BadRequest,
        "OUT time cannot be before IN time"
      );
    }

    this.totalMinutes = Math.floor(diffMinutes);
  }
});

const AttendanceModel = mongoose.model<Attendance, AttendanceModelType>(
  "Attendance",
  AttendanceSchema
);

export type { Attendance, AttendanceDocument, Punch, PunchType };
export default AttendanceModel;