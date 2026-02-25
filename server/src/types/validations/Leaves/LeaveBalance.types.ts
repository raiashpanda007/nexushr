import { z as zod } from "zod"
export const CreateLeaveBalanceValidationSchema = zod.object({
    user: zod.string().min(1, "User is required"),
    leaves: zod.array(zod.object({
        type: zod.string().min(1, "Leave type is required"),
        amount: zod.number().min(1, "Amount is required"),
    })).min(1, "Leaves are required"),
})

export const UpdateLeaveBalanceValidationSchema = zod.object({
    user: zod.string().min(1, "User is required").optional(),
    leaves: zod.array(zod.object({
        type: zod.string().min(1, "Leave type is required"),
        amount: zod.number().min(1, "Amount is required"),
    })).min(1, "Leaves are required").optional(),
})