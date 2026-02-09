import { z as zod } from "zod";
export const CreateEmployeValidationSchema = zod.object({
  email: zod.email(),
  firstName: zod.string().min(1),
  lastName: zod.string(),
  password: zod.string().min(8),
  deptId: zod.string(),
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



