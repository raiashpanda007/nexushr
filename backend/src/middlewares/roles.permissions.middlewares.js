import { AsyncHandler } from "../utils/index.js"
import { ApiError } from "../utils/index.js";
import RoleModel from "../modules/Roles/Models/roles.permissions.model.js"
import Types from "../types/index.js";
const METHOD_MAP = {
  GET: "READ",
  POST: "CREATE",
  PUT: "UPDATE",
  PATCH: "UPDATE",
  DELETE: "DELETE"
};

const PermissionMiddleware = AsyncHandler(async (req, res, next) => {
  const userRoles = req.user.permissions || [];

  if (!userRoles.length) {
    throw new ApiError(Types.Errors.Forbidden, "Forbidden: No permissions assigned");
  }

  const moduleName = req.baseUrl.split("/").slice(-1)[0].toUpperCase();
  const action = METHOD_MAP[req.method];

  const hasPermission = await RoleModel.exists({
    _id: { $in: userRoles },
    permissions: {
      $elemMatch: {
        module: moduleName,
        actions: action
      }
    }
  });

  if (!hasPermission) {
    throw new ApiError(Types.Errors.Forbidden, "Forbidden: Insufficient permissions");
  }

  req.user.dept = hasPermission.department;
  next();
});


export default PermissionMiddleware;
