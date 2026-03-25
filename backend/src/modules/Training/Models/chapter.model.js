import mongoose from "mongoose";

const ChapterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    description: {
      type: String,
      require: true
    },
    pdfResources: [
      {
        name: {
          type: String,
          require: true
        },
        url: {
          type: String,
          require: true
        }
      }
    ],
    docxResources: [
      {
        name: {
          type: String,
          require: true
        },
        url: {
          type: String,
          require: true
        }
      }
    ],
    textResources: [
      {
        name: {
          type: String,
          require: true,
        },
        content: {
          type: String,
          require: true,
        }

      }
    ],
    linkResources: [
      {
        name: {
          type: String,
          require: true,
        },
        link: {
          type: String,
          require: true
        }
      }
    ],
    videoLecture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "videos",
    },
    assessments: [
      {
        assessmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Assesments",
          require: true,

        },
        status: {
          type: String,
          enum: ["not_given", "in_progress", "completed"],
          default: "not_given"
        }
      }
    ]
  }, {
  timestamps: true
}
)

const ChapterModel = mongoose.model("Chapters", ChapterSchema);

export default ChapterModel;
