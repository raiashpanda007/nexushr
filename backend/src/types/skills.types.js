import { z as zod } from "zod";

export const CreateSkill = zod.object({
    name: zod.string().min(1),
    category: zod.string(),
})

export const UpdateSkill = zod.object({
    name: zod.string().min(1),
    category: zod.string(),
})


