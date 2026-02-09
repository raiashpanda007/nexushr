import { CreateHRValidationSchema, CreateEmployeValidationSchema, Login } from "./users.types.js"
import { ErrorTypes } from "./error.types.js"



const Types = {
  User: {
    CreateHR: CreateHRValidationSchema,
    CreateEmp: CreateEmployeValidationSchema,
    Login: Login
  },
  Errors: ErrorTypes
}

export default Types
