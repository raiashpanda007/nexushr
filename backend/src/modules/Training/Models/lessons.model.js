import mongoose from "mongoose";

const LessonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
      trim: true
    },
    description: {
      type: String,
      require: true,
      trim: true
    },

    chapters: [
      {
        rank: {
          type: Number,
          require: true
        },
        chapter: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Chapters"
        }
      }
    ]
  },
  {
    timestamps: true,
  }
)

const LessonModel = mongoose.model("Lessons", LessonSchema);


export default LessonModel;
