import {z as zod}  from "zod";

export const CreateOpeningValidationSchema = zod.object({
    title: zod.string().min(1, "Please provide a title").trim(),
    description: zod.string().min(1, "Please provide a description").trim(),
    departmentId: zod.string().trim(),
    skills: zod.array(zod.object({
        skillId: zod.string().trim().min(1, "Skill id is required"),
        proficiencyLevel: zod.number().min(1, "Proficiency level must be at least 1").max(5, "Proficiency level cannot be more than 5")
    })),
    HiringManager: zod.string().trim(),
    note: zod.string().optional(),
    status: zod.enum(["OPEN", "CLOSED", "PAUSED"]),
    questions: zod.array(zod.object({
        question: zod.string().min(1, "Question is required").trim(),
        type: zod.enum(["TEXT", "MULTIPLE_CHOICE"]),
        options: zod.array(zod.string().min(1, "Option cannot be empty").trim()).optional()
    })).optional(),
    rounds : zod.array(zod.object({
        name: zod.string().min(1, "Round name is required").trim(),
        description: zod.string().trim(),
        type: zod.enum(["INTERVIEW", "TEST", "ASSIGNMENT"]),

    })).optional()
});