import { CreateHRValidationSchema, CreateEmployeValidationSchema, Login, UserUpdatesValidationSchema } from "./users.types.js"
import { CreateSkill, UpdateSkill } from "./skills.types.js"
import { CreateDepartmentValidationSchema, UpdateDepartmentValidationSchema } from "./departments.types.js"
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
  Errors: ErrorTypes
}

export default Types
