import mongoose from "mongoose";

const PayrollSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true
    },
    bonus: [
      {
        reason: {
          type: String,
          required: true,
          minLength: 1,
          maxLength: 500
        },
        amount: {
          type: BigInt,
          required: true,
        }
      }
    ],
    deduction: [
      {
        reason: {
          type: String,
          required: true,
          minLength: 1,
          maxLength: 500
        },
        amount: {
          type: BigInt,
          required: true,
        }
      }
    ],
    salary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salaries",
      required: true
    }
  },
  {
    timestamps: true
  }
)


PayrollSchema.index({ user: 1 });


PayrollSchema.pre("save", async function(next) {
  try {
    if (!this.isModified("bonus")) return next();
    this.bonus.forEach((val) => {
      val.amount = Math.abs(val.amount)
    })
    next();
  } catch (e) {
    next(e);
  }
})


PayrollSchema.pre("save", async function(next) {
  try {
    if (!this.isModified("deduction")) return next();
    this.deduction.forEach((val) => {
      val.amount = -Math.abs(val.amount)
    })
  } catch (e) {
    next(e);
  }
})


export const PayrollModal = mongoose.model("Payrolls", PayrollSchema);
