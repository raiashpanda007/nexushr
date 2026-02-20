import { z as zod } from "zod"



export const CreateSalaryValidationSchema = zod.object({
    baseSalary: zod.number().min(1).max(1000000, "Base Salary must be between 1 and 1000000"),
    hra: zod.number().min(1).max(1000000, "HRA must be between 1 and 1000000"),
    lta: zod.number().min(1).max(1000000, "LTA must be between 1 and 1000000"),
    userId: zod.string()
})



export const UpdateSalaryValidationSchema = zod.object({
    baseSalary: zod.number().min(1).max(1000000, "Base Salary must be between 1 and 1000000"),
    hra: zod.number().min(1).max(1000000, "HRA must be between 1 and 1000000"),
    lta: zod.number().min(1).max(1000000, "LTA must be between 1 and 1000000"),
})

