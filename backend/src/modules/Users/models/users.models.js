import mongoose from "mongoose";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      required: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["HR", "EMPLOYEE"],
      required: true,
    },

    deptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Departments",
      required: true,
    },

    profilePhoto: {
      type: String,
    },
    payroll: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payrolls"
      }

    ],
    note: {
      type: String,
      trim: true,
    },
    online: {
      type: Boolean,
      default: false,
    },
    skills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Skills",
        required: true
      }
    ],

  },
  {
    timestamps: true,
    versionKey: false,
  }
);


UserSchema.index({ role: 1 });
UserSchema.index({ deptId: 1 });
UserSchema.index({ online: 1 });




UserSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;

  const saltRounds = 10;
  this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
});



UserSchema.index({
  firstName: "text",
  lastName: "text",
  email: "text",
  role: "text",
})



const UserModel = mongoose.model("Users", UserSchema);


export default UserModel

