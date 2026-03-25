import mongoose from "mongoose";

const AssessmentAttemptSchema = new mongoose.Schema(
  {
    attemptedAt: { type: Date, default: Date.now },
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId },
        answer: { type: String, trim: true }
      }
    ],
    score:        { type: Number },
    totalScore:   { type: Number },
    percentage:   { type: Number },
    passed:       { type: Boolean },
    reviewStatus: { type: String, enum: ["pending_review", "reviewed"], default: "reviewed" },
    reviewedAt:   { type: Date },
    reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    reviewerNote: { type: String, trim: true },
  },
  { _id: false }
);

const ChapterProgressSchema = new mongoose.Schema(
  {
    chapter:    { type: mongoose.Schema.Types.ObjectId, ref: "Chapters" },
    status:     { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started" },
    openedAt:   { type: Date },
    completedAt:{ type: Date },
    assessmentAttempts: [AssessmentAttemptSchema]
  },
  { _id: false }
);

const UserProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lessons",
      required: true
    },
    currentChapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapters"
    },
    completedChapters: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chapters"
      }
    ],
    chapterProgress: [ChapterProgressSchema],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users"
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started"
    }
  },
  { timestamps: true }
);

UserProgressSchema.index({ user: 1, lesson: 1 }, { unique: true });
UserProgressSchema.index({ lesson: 1 });

const UserProgressModel = mongoose.model("UserProgress", UserProgressSchema);

export default UserProgressModel;
