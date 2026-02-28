import { z as zod } from "zod"
export const CreateAssetValidationSchema = zod.object({
    name: zod.string().min(1, "Name is required").trim(),
    photoURL: zod.string().min(1, "Photo URL is required    ").trim(),
    description: zod.string().min(1, "Description is required").trim(),
    status: zod.string().min(1, "Status is required").trim(),
    currentOwner: zod.string().min(1, "Current Owner is required").trim(),
    purchaseDate: zod.string().min(1, "Purchase Date is required").trim(),
    purchasePrice: zod.string().min(1, "Purchase Price is required"),
    warrantyPeriod: zod.string().min(1, "Warranty Period is required").trim(),
    notes: zod.string().min(1, "Notes is required").trim(),
})

export const UpdateAssetValidationSchema = zod.object({
    name: zod.string().min(1, "Name is required").trim(),
    photoURL: zod.string().min(1, "Photo URL is required").trim(),
    description: zod.string().min(1, "Description is required").trim(),
    status: zod.string().min(1, "Status is required").trim(),
    currentOwner: zod.string().min(1, "Current Owner is required").trim(),
    purchaseDate: zod.string().min(1, "Purchase Date is required").trim(),
    purchasePrice: zod.string().min(1, "Purchase Price is required").trim(),
    warrantyPeriod: zod.string().min(1, "Warranty Period is required").trim(),
    notes: zod.string().min(1, "Notes is required").trim(),
})

