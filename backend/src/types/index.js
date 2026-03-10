import { CreateHRValidationSchema, CreateEmployeValidationSchema, Login, UserUpdatesValidationSchema } from "./users.types.js"
import { CreateSkill, UpdateSkill } from "./skills.types.js"
import { CreateDepartmentValidationSchema, UpdateDepartmentValidationSchema } from "./departments.types.js"
import { CreateLeaveTypeValidationSchema, UpdateLeaveTypeValidationSchema } from "./Leaves/LeaveTypes.types.js"
import { CreateLeaveRequestValidationSchema, UpdateLeaveRequestValidationSchema, ResponseLeaveRequestValidationSchema } from "./Leaves/LeaveRequest.types.js"
import { CreateLeaveBalanceValidationSchema, UpdateLeaveBalanceValidationSchema } from "./Leaves/LeaveBalance.types.js"
import { CreateSalaryValidationSchema, UpdateSalaryValidationSchema } from "./salaries.types.js"
import { CreatePayrollValidationSchema, GenerateBulkPayrollValidationSchema } from "./payroll.types.js"
import { CreateEventSchema, UpdateEventSchema } from "./event.types.js"
import { CreateAttendanceValidationSchema } from "./attendance.types.js"
import { CreateAssetValidationSchema, UpdateAssetValidationSchema } from "./asset.types.js"
import { CreateOpeningValidationSchema } from "./Hiring/opening.types.js"
import { OfflineQueueValidationSchema } from "./sync.types.js"
import { CreateApplicantValidationSchema , UpdateApplicantValidationSchema} from "./Hiring/applicant.types.js"
import { CreateInterviewSchema, UpdateInterviewSchema } from "./Hiring/interview.types.js"
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
  Salaries: {
    Create: CreateSalaryValidationSchema,
    Update: UpdateSalaryValidationSchema
  },
  Payroll: {
    Create: CreatePayrollValidationSchema,
    GenerateBulk: GenerateBulkPayrollValidationSchema
  },
  Attendance: {
    Create: CreateAttendanceValidationSchema
  },
  Events: {
    Create: CreateEventSchema,
    Update: UpdateEventSchema
  },
  Assets: {
    Create: CreateAssetValidationSchema,
    Update: UpdateAssetValidationSchema
  },
  Openings: {
    Create: CreateOpeningValidationSchema
  },
  Applicants: {
    Create: CreateApplicantValidationSchema,
    Update: UpdateApplicantValidationSchema
  },
  Interviews: {
    Create: CreateInterviewSchema,
    Update: UpdateInterviewSchema
  },
  OfflineQueue: OfflineQueueValidationSchema,
  Errors: ErrorTypes
}

export default Types
