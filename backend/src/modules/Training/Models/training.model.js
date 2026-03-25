import mongoose from "mongoose";

const TrainingSchema = new mongoose.Schema(
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
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
      }
    ],
    reviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"

      }
    ],
    Lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lessons"
      }
    ]

  },
  {
    timestamps: true,
  }
)


TrainingSchema.pre("save", async function() {
  const studentIds = this.students.map((id) => id.toString());
  const reviewerIds = this.reviewers.map((id) => id.toString());
  const overlap = reviewerIds.some((id) => studentIds.includes(id));
  if (overlap) {
    throw new Error("A user cannot be both a student and a reviewer in the same training.");
  }
});

const TraningModel = mongoose.model("Training", TrainingSchema);


export default TraningModel;
