import { z as zod } from "zod";

export const CreatePayrollValidationSchema = zod.object({
    user: zod.string().min(1, "User ID is required"),
    bonus: zod.array(
        zod.object({
            reason: zod.string().min(1, "Reason is required").trim(),
            amount: zod.number().min(1, "Amount is required"),
        })
    ).optional(),
    deduction: zod.array(
        zod.object({
            reason: zod.string().min(1, "Reason is required").trim(),
            amount: zod.number().min(1, "Amount is required"),
        })
    ).optional(),
    salary: zod.string().min(1, "Salary ID is required"),
    month: zod.number().min(1, "Month is required").max(12, "Month is required"),
    year: zod.number().min(1900, "Year is required").max(2100, "Year is required"),
})


export const GenerateBulkPayrollValidationSchema = zod.object({
    month: zod.number().min(1, "Month is required").max(12, "Month is required"),
    year: zod.number().min(1900, "Year is required").max(2100, "Year is required"),
    department: zod.array(zod.string().trim()).optional(),
})