import { z } from "zod";

const ObjectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

export const AddStudentsSchema = z.object({
  studentIds: z
    .array(ObjectIdSchema)
    .min(1, "At least one student ID is required"),
});

export const AddStudentsBySkillSchema = z.object({
  skillId: ObjectIdSchema,
  maxLevel: z.number().int().min(1).max(5),
});
