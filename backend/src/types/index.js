import { CreateHRValidationSchema, CreateEmployeValidationSchema, Login, UserUpdatesValidationSchema } from "./users.types.js"
import { ErrorTypes } from "./error.types.js"



const Types = {
  User: {
    CreateHR: CreateHRValidationSchema,
    CreateEmp: CreateEmployeValidationSchema,
    Login: Login,
    UserUpdates: UserUpdatesValidationSchema
  },
  Errors: ErrorTypes
}

export default Types
