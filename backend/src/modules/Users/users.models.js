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
      ref: "Department",
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
    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
          expires: 60 * 60 * 24 * 30
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ deptId: 1 });
UserSchema.index({ online: 1 });


UserSchema.pre("save", function(next) {
  if (!this.isModified("refreshTokens")) return next();

  const MAX_SESSIONS = 5;

  if (this.refreshTokens.length > MAX_SESSIONS) {
    this.refreshTokens = this.refreshTokens
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-MAX_SESSIONS);
  }
  next();
});


UserSchema.pre("save", async function(next) {
  try {
    if (!this.isModified("passwordHash")) return next();
    const saltRounds = 10;
    this.passwordHash = await bcrypt.hash(
      this.passwordHash,
      saltRounds
    );
    next();
  } catch (err) {
    next(err);
  }
});


export const UserModal = mongoose.model("Users", UserSchema);

