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
          type: Number,
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
          type: Number,
          required: true,
        }
      }
    ],
    salary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salaries",
      required: true
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    year: {
      type: Number,
      required: true,
      min: 1900,
      max: 2100
    }
  },
  {
    timestamps: true
  }
)


PayrollSchema.index({ user: 1 });


PayrollSchema.pre("save", async function () {
  if (!this.isModified("bonus")) return;
  this.bonus.forEach((val) => {
    val.amount = Math.abs(val.amount)
  })
})


PayrollSchema.pre("save", async function () {
  if (!this.isModified("deduction")) return;
  this.deduction.forEach((val) => {
    val.amount = -Math.abs(val.amount)
  })
})

PayrollSchema.pre("save", async function () {
  if (!this.isModified("month") || !this.isModified("year")) return;
  const payroll = await PayrollModal.findOne({
    user: this.user,
    month: this.month,
    year: this.year
  })
  if (payroll) {
    throw new ApiError(400, "Payroll already exists for this month and year");
  }
})



const PayrollModal = mongoose.model("Payrolls", PayrollSchema);


export default PayrollModal;
