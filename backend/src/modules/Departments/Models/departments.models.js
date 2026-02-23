import mongoose from "mongoose";
const DepartmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minLength: 1,

    },
    description: {
      type: String,
      require: true,
      minLength: 1,
      maxLength: 1000
    },
  },
  {
    timestamps: true,
  }
);


DepartmentSchema.index({
  name: "text",

})


const DepartmentModal = mongoose.model("Departments", DepartmentSchema);
export default DepartmentModal
