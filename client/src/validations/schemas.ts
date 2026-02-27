import { z } from "zod";

// ============ Employee Validations ============
export const CreateEmployeeSchema = z.object({
    email: z.string().email("Please provide a valid email address"),
    firstName: z.string().min(1, "Please provide first name").trim(),
    lastName: z.string().min(1, "Please provide last name").trim(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    deptId: z.string().min(1, "Please select a department"),
    profilePhoto: z.string().min(1, "Profile photo is required"),
    note: z.string().optional(),
    skills: z.array(z.string()).optional(),
});

export const UpdateEmployeeSchema = z.object({
    email: z.string().email("Please provide a valid email address").optional(),
    firstName: z.string().min(1, "Please provide first name").trim().optional(),
    lastName: z.string().min(1, "Please provide last name").trim().optional(),
    deptId: z.string().optional(),
    profilePhoto: z.string().optional(),
    note: z.string().optional(),
    skills: z.array(z.string()).optional(),
});

// ============ Department Validations ============
export const CreateDepartmentSchema = z.object({
    name: z.string().min(1, "Department name is required"),
    description: z.string().min(1, "Department description is required"),
});

export const UpdateDepartmentSchema = z.object({
    name: z.string().min(1, "Department name is required").optional(),
    description: z.string().min(1, "Department description is required").optional(),
});

// ============ Skill Validations ============
export const CreateSkillSchema = z.object({
    name: z.string().min(1, "Skill name is required"),
    category: z.string().min(1, "Category is required"),
});

export const UpdateSkillSchema = z.object({
    name: z.string().min(1, "Skill name is required"),
    category: z.string().min(1, "Category is required"),
});

// ============ Salary Validations ============
export const CreateSalarySchema = z.object({
    baseSalary: z.number()
        .min(0, "Base Salary must be at least 0")
        .max(1000000, "Base Salary must be between 0 and 1000000"),
    hra: z.number()
        .min(0, "HRA must be at least 0")
        .max(1000000, "HRA must be between 0 and 1000000"),
    lta: z.number()
        .min(0, "LTA must be at least 0")
        .max(1000000, "LTA must be between 0 and 1000000"),
    userId: z.string().min(1, "Please select an employee"),
});

export const UpdateSalarySchema = z.object({
    baseSalary: z.number()
        .min(0, "Base Salary must be at least 0")
        .max(1000000, "Base Salary must be between 0 and 1000000"),
    hra: z.number()
        .min(0, "HRA must be at least 0")
        .max(1000000, "HRA must be between 0 and 1000000"),
    lta: z.number()
        .min(0, "LTA must be at least 0")
        .max(1000000, "LTA must be between 0 and 1000000"),
});

// ============ Payroll Validations ============
export const CreatePayrollSchema = z.object({
    user: z.string().min(1, "User ID is required"),
    salary: z.string().min(1, "Salary is required. Please create a salary for this employee first."),
    month: z.number()
        .min(1, "Month is required")
        .max(12, "Month must be between 1 and 12"),
    year: z.number()
        .min(1900, "Year is required")
        .max(2100, "Year must be between 1900 and 2100"),
    bonus: z.array(
        z.object({
            reason: z.string().min(1, "Reason is required"),
            amount: z.number().min(1, "Amount must be at least 1"),
        })
    ).optional(),
    deduction: z.array(
        z.object({
            reason: z.string().min(1, "Reason is required"),
            amount: z.number().min(1, "Amount must be at least 1"),
        })
    ).optional(),
});

// ============ Leave Type Validations ============
export const CreateLeaveTypeSchema = z.object({
    name: z.string().min(1, "Leave type name is required"),
    code: z.string().min(1, "Leave type code is required"),
    length: z.enum(["HALF", "FULL"], {
        message: "Please select a valid leave length (HALF or FULL)"
    }),
    isPaid: z.boolean().default(true),
});

export const UpdateLeaveTypeSchema = z.object({
    name: z.string().min(1, "Leave type name is required").optional(),
    code: z.string().min(1, "Leave type code is required").optional(),
    length: z.enum(["HALF", "FULL"]).optional(),
    isPaid: z.boolean().optional(),
});

// ============ Leave Balance Validations ============
export const CreateLeaveBalanceSchema = z.object({
    user: z.string().min(1, "Please select an employee"),
    leaves: z.array(
        z.object({
            type: z.string().min(1, "Leave type is required"),
            amount: z.number().min(1, "Amount must be at least 1 day"),
        })
    ).min(1, "At least one leave allocation is required"),
});

export const UpdateLeaveBalanceSchema = z.object({
    user: z.string().min(1, "User is required"),
    leaves: z.array(
        z.object({
            type: z.string().min(1, "Leave type is required"),
            amount: z.number().min(0, "Amount cannot be negative"),
        })
    ).min(1, "At least one leave allocation is required"),
});

// ============ Leave Request Validations ============
export const CreateLeaveRequestSchema = z.object({
    type: z.string().min(1, "Please select a leave type"),
    quantity: z.number()
        .min(1, "Quantity must be at least 1 day")
        .max(31, "Quantity cannot exceed 31 days"),
    from: z.string().min(1, "From date is required"),
    to: z.string().min(1, "To date is required"),
}).refine((data) => {
    if (!data.from || !data.to) return true;
    return new Date(data.to) >= new Date(data.from);
}, {
    message: "'To' date must be on or after 'From' date",
    path: ["to"],
});

// ============ Login Validations ============
export const LoginSchema = z.object({
    email: z.string().email("Please provide a valid email address"),
    password: z.string().min(1, "Password is required"),
});

// Type exports for use in components
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof UpdateDepartmentSchema>;
export type CreateSkillInput = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillInput = z.infer<typeof UpdateSkillSchema>;
export type CreateSalaryInput = z.infer<typeof CreateSalarySchema>;
export type UpdateSalaryInput = z.infer<typeof UpdateSalarySchema>;
export type CreatePayrollInput = z.infer<typeof CreatePayrollSchema>;
export type CreateLeaveTypeInput = z.infer<typeof CreateLeaveTypeSchema>;
export type UpdateLeaveTypeInput = z.infer<typeof UpdateLeaveTypeSchema>;
export type CreateLeaveBalanceInput = z.infer<typeof CreateLeaveBalanceSchema>;
export type UpdateLeaveBalanceInput = z.infer<typeof UpdateLeaveBalanceSchema>;
export type CreateLeaveRequestInput = z.infer<typeof CreateLeaveRequestSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

// ============ Event Validations ============
export const CreateEventSchema = z.object({
    name: z.string().min(2, "Event name must be at least 2 characters").max(100, "Event name must be at most 100 characters"),
    description: z.string().min(2, "Description must be at least 2 characters").max(1000, "Description must be at most 1000 characters"),
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
    type: z.enum(["MEETING", "BIRTHDAY", "ANNIVERSARY", "OTHER", "HOLIDAY"], {
        message: "Please select a valid event type"
    }),
    forAll: z.boolean().default(false),
    employees: z.array(z.string()).optional(),
    departments: z.array(z.string()).optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

// Helper function to format Zod errors into field-specific errors
export function formatZodErrors(error: z.ZodError): Record<string, string> {
    const errors: Record<string, string> = {};
    for (const issue of error.issues) {
        const path = issue.path.join(".");
        if (!errors[path]) {
            errors[path] = issue.message;
        }
    }
    return errors;
}

// Helper function to get first error message
export function getFirstZodError(error: z.ZodError): string {
    return error.issues[0]?.message || "Validation failed";
}
