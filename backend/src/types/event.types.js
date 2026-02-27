import { z as zod } from "zod";

export const CreateEventSchema = zod.object({
  name: zod.string().min(2).max(100).trim(),
  description: zod.string().min(2).max(1000).trim(),
  date: zod.coerce.date(),
  time: zod.string().min(1).max(20).trim(),
  type: zod.enum(["MEETING", "BIRTHDAY", "ANNIVERSARY", "OTHER", "HOLIDAY"]),
  forAll: zod.boolean().default(false),
  employees: zod.array(zod.string()).default([]),
  departments: zod.array(zod.string()).default([]),
});

export const UpdateEventSchema = zod.object({
  id: zod.string().min(1).trim(),
  name: zod.string().min(2).max(100).trim().optional(),
  description: zod.string().min(2).max(1000).trim().optional(),
  date: zod.coerce.date().optional(),
  time: zod.string().min(1).max(20).trim().optional(),
  type: zod.enum(["MEETING", "BIRTHDAY", "ANNIVERSARY", "OTHER", "HOLIDAY"]).optional(),
  forAll: zod.boolean().optional(),
  employees: zod.array(zod.string()).optional(),
  departments: zod.array(zod.string()).optional(),
});
