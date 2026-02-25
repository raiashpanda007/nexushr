import type { ConfigType, ServicesType } from "./config.types";
import { StatusCodes } from "./Error.types";
import { CreateHRValidationSchema, CreateEmployeValidationSchema, Login, UserUpdatesValidationSchema } from "./validations/users.types.js"
import { CreateSkill, UpdateSkill } from "./validations/skills.types"
import { CreateDepartmentValidationSchema, UpdateDepartmentValidationSchema } from "./validations/departments.types"
import { CreateLeaveTypeValidationSchema, UpdateLeaveTypeValidationSchema } from "./validations/Leaves/LeaveTypes.types"
import { CreateLeaveRequestValidationSchema, UpdateLeaveRequestValidationSchema, ResponseLeaveRequestValidationSchema } from "./validations/Leaves/LeaveRequest.types"
import { CreateLeaveBalanceValidationSchema, UpdateLeaveBalanceValidationSchema } from "./validations/Leaves/LeaveBalance.types"
import { CreateSalaryValidationSchema, UpdateSalaryValidationSchema } from "./validations/salaries.types"
import { CreatePayrollValidationSchema } from "./validations/payroll.types"
import { CreateAttendanceValidationSchema } from "./validations/attendance.types.js"
import { OfflineQueueValidationSchema } from "./validations/sync.types"

export type { ConfigType, ServicesType }

const Types = {
    Validation: {
        Attendance: {
            Create: CreateAttendanceValidationSchema
        },
        User: {
            CreateHR: CreateHRValidationSchema,
            CreateEmp: CreateEmployeValidationSchema,
            Login: Login,
            UserUpdates: UserUpdatesValidationSchema
        },
        Skills: {
            Create: CreateSkill,
            Update: UpdateSkill,
        },
        Departments: {
            Create: CreateDepartmentValidationSchema,
            Update: UpdateDepartmentValidationSchema,
        },
        LeaveTypes: {
            Create: CreateLeaveTypeValidationSchema,
            Update: UpdateLeaveTypeValidationSchema,
        },
        LeaveBalances: {
            Create: CreateLeaveBalanceValidationSchema,
            Update: UpdateLeaveBalanceValidationSchema,
        },
        LeaveRequests: {
            Create: CreateLeaveRequestValidationSchema,
            Update: UpdateLeaveRequestValidationSchema,
            Response: ResponseLeaveRequestValidationSchema
        },
        Salaries: {
            Create: CreateSalaryValidationSchema,
            Update: UpdateSalaryValidationSchema
        },
        Payroll: {
            Create: CreatePayrollValidationSchema
        },

        OfflineQueue: OfflineQueueValidationSchema,

    },
    StatusCodes
}

export default Types;
