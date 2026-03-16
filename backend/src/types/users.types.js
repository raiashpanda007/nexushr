import { z as zod } from "zod";
export const CreateEmployeValidationSchema = zod.object({
  email: zod.email().trim(),
  firstName: zod.string().min(1, "Please provide first name").trim(),
  lastName: zod.string().min(1, "Please provide last name").trim(),
  password: zod.string().min(8, "Password must be at least 8 characters long").trim(),
  deptId: zod.string().trim(),
  profilePhoto: zod.string(),
  note: zod.string().optional(),
  skills: zod.array(zod.object({
    skillId: zod.string().trim().min(1, "Skill id is required"),
    amount: zod.number().min(1, "Skill amount must be at least 1").max(5, "Skill amount cannot be more than 5")
  }))
})
export const CreateHRValidationSchema = zod.object({
  email: zod.email(),
  firstName: zod.string().min(1, "Please provide first name"),
  lastName: zod.string().min(1, "Please provide last name"),
  password: zod.string().min(8, "Password must be at least 8 characters long"),
  profilePhoto: zod.string().optional(),
  note: zod.string().optional(),
})
export const Login = zod.object({
  email: zod.email(),
  password: zod.string()
})

export const UserUpdatesValidationSchema = zod.object({
  email: zod.email().optional(),
  firstName: zod.string().min(1, "Please provide first name").trim().optional(),
  lastName: zod.string().min(1, "Please provide last name").trim().optional(),
  deptId: zod.string().trim().optional(),
  profilePhoto: zod.string().optional(),
  note: zod.string().trim().optional(),
  skills: zod.array(zod.object({
    skillId: zod.string().trim().min(1, "Skill id is required"),
    amount: zod.number().min(1, "Skill amount must be at least 1").max(5, "Skill amount cannot be more than 5")
  })).optional()
})

export const CreateEmployeeValidationByRole = zod.object({
  email: zod.email().trim(),
  firstName: zod.string().min(1, "Please provide first name").trim(),
  lastName: zod.string().min(1, "Please provide last name").trim(),
  password: zod.string().min(8, "Password must be at least 8 characters long").trim(),
  profilePhoto: zod.string(),
  note: zod.string().optional(),
  skills: zod.array(zod.object({
    skillId: zod.string().trim().min(1, "Skill id is required"),
    amount: zod.number().min(1, "Skill amount must be at least 1").max(5, "Skill amount cannot be more than 5")
  }))

})

export const UpdateEmployeeValidationRole = zod.object({
  email: zod.email().optional(),
  firstName: zod.string().min(1, "Please provide first name").trim().optional(),
  lastName: zod.string().min(1, "Please provide last name").trim().optional(),
  profilePhoto: zod.string().optional(),
  note: zod.string().trim().optional(),
  skills: zod.array(zod.object({
    skillId: zod.string().trim().min(1, "Skill id is required"),
    amount: zod.number().min(1, "Skill amount must be at least 1").max(5, "Skill amount cannot be more than 5")
  }))
})



