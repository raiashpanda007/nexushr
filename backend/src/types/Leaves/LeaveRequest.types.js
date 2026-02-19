import { z as zod } from "zod"

export const CreateLeaveRequestValidationSchema = zod.object({
    type: zod.string().min(1).max(255),
    quantity: zod.number().min(1).max(31),
    from: zod.date(),
    to: zod.date()
})


export const UpdateLeaveRequestValidationSchema = zod.object({
    type: zod.string().min(1).max(255),
    quantity: zod.number().min(1).max(31),
    from: zod.date(),
    to: zod.date()
})


export const ResponseLeaveRequestValidationSchema = zod.object({
    status: zod.enum(["APPROVED", "REJECTED"]),
})