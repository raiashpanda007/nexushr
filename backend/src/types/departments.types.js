import { z as zod } from "zod"


export const CreateDepartmentValidationSchema = zod.object({
    name: zod.string().min(1, "Department name is required"),
    description: zod.string().min(1, "Department description is required"),
})

export const UpdateDepartmentValidationSchema = zod.object({
    name: zod.string().min(1, "Department name is required").optional(),
    description: zod.string().min(1, "Department description is required").optional(),
})