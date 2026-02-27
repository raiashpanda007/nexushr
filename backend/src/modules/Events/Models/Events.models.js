import { mongoose } from "mongoose";

const EventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    time:{
        type: String,
        required: true,
    },
    respectedToDepartments: [{  
        type: mongoose.Schema.Types.ObjectId,
        ref: "Department",
      },
    ],
    resepectedEmplooyees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    type: {
      type: String,
      enum: ["MEETING", "BIRTHDAY", "ANNIVERSARY", "OTHER", "HOLIDAY"],
      required: true,

    },
    forAll:{
        type: Boolean,
        default: false,
    },
  },
  {
    timestamps: true,
  },
);

const EventModel = mongoose.model("Event", EventSchema);

export default EventModel;
