import { z as zod } from 'zod';

const ModulesEnums = [
  "EMPLOYEES",
  "DEPARTMENTS",
  "ATTENDANCE",
  "LEAVE",
  "PAYROLL",
]
export const CreateRoleValidationSchema = zod.object({
  name: zod.string().min(3, "Role should min. name of three letters").max(50, "Role name must be between 3 and 50 characters"),
  permissions: zod.array(
    zod.object({
      module: zod.enum(ModulesEnums, "Invalid module name"),
      actions: zod.array(
        zod.enum(["CREATE", "READ", "UPDATE", "DELETE"], "Invalid action")
      ).min(1, "At least one action is required")
    })
  ).min(1, "At least one permission is required"),
  departmentId: zod.string(),
  users: zod.array(zod.string()).optional()
});

export const UpdateRoleValidationSchema = zod.object({
  name: zod.string().min(3, "Role should min. name of three letters").max(50, "Role name must be between 3 and 50 characters").optional(),
  permissions: zod.array(
    zod.object({
      module: zod.enum(ModulesEnums, "Invalid module name"),
      actions: zod.array(
        zod.enum(["CREATE", "READ", "UPDATE", "DELETE"], "Invalid action")
      ).min(1, "At least one action is required")
    })
  ).min(1, "At least one permission is required").optional(),
  departmentId: zod.string().optional(),
  users: zod.array(zod.string()).optional()
});

