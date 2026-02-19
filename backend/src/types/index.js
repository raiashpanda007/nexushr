import { CreateHRValidationSchema, CreateEmployeValidationSchema, Login, UserUpdatesValidationSchema } from "./users.types.js"
import { CreateSkill, UpdateSkill } from "./skills.types.js"
import { CreateDepartmentValidationSchema, UpdateDepartmentValidationSchema } from "./departments.types.js"
import { CreateLeaveTypeValidationSchema, UpdateLeaveTypeValidationSchema } from "./Leaves/LeaveTypes.types.js"
import { CreateLeaveRequestValidationSchema, UpdateLeaveRequestValidationSchema, ResponseLeaveRequestValidationSchema } from "./Leaves/LeaveRequest.types.js"
import { CreateLeaveBalanceValidationSchema, UpdateLeaveBalanceValidationSchema } from "./Leaves/LeaveBalance.types.js"
import { ErrorTypes } from "./error.types.js"



const Types = {
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
  Errors: ErrorTypes
}

export default Types
