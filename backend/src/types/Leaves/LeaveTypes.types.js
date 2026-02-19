import { z as zod } from "zod"

export const CreateLeaveTypeValidationSchema = zod.object({
    name: zod.string().min(1, "Leave type name is required"),
    code: zod.string().min(1, "Leave type code is required"),
    length: zod.enum(["HALF", "FULL"]),
    isPaid: zod.boolean().default(true)
})

export const UpdateLeaveTypeValidationSchema = zod.object({
    name: zod.string().min(1, "Leave type name is required").optional(),
    code: zod.string().min(1, "Leave type code is required").optional(),
    length: zod.enum(["HALF", "FULL"]).optional(),
    isPaid: zod.boolean().default(true).optional()
})