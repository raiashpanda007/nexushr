import mongoose from "mongoose";


const QuestionSchema = new mongoose.Schema(
    {
        questionText: {
            type: String,
            required: true,
            trim: true,
        },
        questionType: {
            type: String,
            enum: ["TEXT", "MULTIPLE_CHOICE"],
            required: true,
        },
        options: [
            {
                type: String,
                trim: true,
            },
        ],
    },
    {
        timestamps: true,
    },
);

const QuestionModel = mongoose.model("Questions", QuestionSchema);
export default QuestionModel;