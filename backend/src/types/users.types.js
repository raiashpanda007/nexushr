import { z as zod } from "zod";
export const CreateEmployeValidationSchema = zod.object({
  email: zod.email().trim(),
  firstName: zod.string().min(1).trim(),
  lastName: zod.string().trim(),
  password: zod.string().min(8).trim(),
  deptId: zod.string().trim(),
  profilePhoto: zod.string().optional(),
  note: zod.string().optional(),
  skills: zod.array(zod.string())
})
export const CreateHRValidationSchema = zod.object({
  email: zod.email(),
  firstName: zod.string().min(1),
  lastName: zod.string(),
  password: zod.string().min(8),
  profilePhoto: zod.string().optional(),
  note: zod.string().optional(),
})
export const Login = zod.object({
  email: zod.email(),
  password: zod.string()
})

export const UserUpdatesValidationSchema = zod.object({
  email: zod.email().optional(),
  firstName: zod.string().min(1).optional(),
  lastName: zod.string().optional(),
  deptId: zod.string().optional(),
  profilePhoto: zod.string().optional(),
  note: zod.string().optional(),
  skills: zod.array(zod.string()).optional()
})





