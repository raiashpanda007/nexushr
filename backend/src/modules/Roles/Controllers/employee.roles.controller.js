import UsersModel from "../../Users/models/users.models.js";
import RolesModel from "../Models/roles.permissions.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
class EmployeeRolesController {

  constructor() {
    this.userRepo = UsersModel;
    this.rolesRepo = RolesModel;
  }

  Create = AsyncHandler(async (req, res) => {


  })

  Delete = AsyncHandler(async (req, res) => { })

  Update = AsyncHandler(async (req, res) => { })

  Get = AsyncHandler(async (req, res) => { });

  Delete = AsyncHandler(async (req, res) => { });

}


export default EmployeeRolesController;
