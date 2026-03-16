import mongoose from "mongoose";

const MODULES = [
  "EMPLOYEES",
  "ATTENDANCE",
  "LEAVE",
  "PAYROLL",
  "ASSETS"
]


const PermissionsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    permissions: [
      {
        module: {
          type: String,
          enum: MODULES,
          required: true,
        },
        actions: {
          type: [String],
          enum: ["CREATE", "READ", "UPDATE", "DELETE"],
          required: true,
        },
      }
    ],

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Departments",
      required: true,
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users"
      }
    ]

  },
  { timestamps: true }
);

PermissionsSchema.index({ name: 1 }, { unique: true });

PermissionsSchema.index({ department: 1 });

const RolesModels = mongoose.model("Permissions", PermissionsSchema);
export default RolesModels;
