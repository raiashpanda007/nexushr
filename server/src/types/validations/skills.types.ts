import { z as zod } from "zod";

export const CreateSkill = zod.object({
    name: zod.string().min(1).trim(),
    category: zod.string().min(1).trim(),
})

export const UpdateSkill = zod.object({
    name: zod.string().min(1).trim(),
    category: zod.string().trim(),
})


