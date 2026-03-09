import mongoose from "mongoose";

const RoundsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ["INTERVIEW", "TEST", "ASSIGNMENT"],
    required: true,
  },

});


const RoundsModel = mongoose.model("Rounds", RoundsSchema);
export default RoundsModel;