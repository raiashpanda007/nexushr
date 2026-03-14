import mongoose from "mongoose";
import RolesModels from "../Models/roles.permissions.model.js";
import UsersModel from "../../Users/models/users.models.js";
import { AsyncHandler, ApiError, ApiResponse } from "../../../utils/index.js";
import Types from "../../../types/index.js"

class PermissionsController {
  constructor() {
    this.repo = RolesModels;
  }

  Create = AsyncHandler(async (req, res) => {

    const parsedBody = Types.Roles.Create.safeParse(req.body);

    if (req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "You don't have permission to perform this action");
    }
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Invalid request body", parsedBody.error);
    }

    const { name, permissions, departmentId, users } = parsedBody.data;

    // Start a transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Create the role within the transaction
      const createdRole = await this.repo.create([{ name, permissions, department: departmentId, users }], { session });
      
      // If users are provided, update their permissions field to reference this role
      if (users && users.length > 0) {
        await UsersModel.updateMany(
          { _id: { $in: users } },
          { permissions: createdRole[0]._id },
          { session }
        );
      }

      await session.commitTransaction();
      return res.status(201).json(new ApiResponse(201, createdRole[0], "Role created successfully"));
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  });


  Update = AsyncHandler(async (req, res) => {
    const parsedBody = Types.Roles.Update.safeParse(req.body);

    const id = req.params.id;
    if (!id) {
      throw new ApiError(Types.Errors.UnprocessableData, "Role ID is required");
    }
    if (req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "You don't have permission to perform this action");
    }
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Invalid request body", parsedBody.error);
    }

    const { name, permissions, departmentId, users } = parsedBody.data;

    // Start a transaction session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Get the current role to check existing users
      const currentRole = await this.repo.findById(id).session(session);
      
      if (!currentRole) {
        throw new ApiError(Types.Errors.NotFound, "Role not found");
      }

      // If users are being updated, we need to handle the old users
      if (users !== undefined) {
        // Remove permissions from users no longer in this role
        const oldUserIds = currentRole.users || [];
        const newUserIds = users || [];
        const usersToRemove = oldUserIds.filter(userId => !newUserIds.includes(userId.toString()));
        
        if (usersToRemove.length > 0) {
          await UsersModel.updateMany(
            { _id: { $in: usersToRemove } },
            { $unset: { permissions: "" } },
            { session }
          );
        }

        // Add permissions to new users
        if (newUserIds.length > 0) {
          await UsersModel.updateMany(
            { _id: { $in: newUserIds } },
            { permissions: id },
            { session }
          );
        }
      }

      // Update the role
      const updatedRole = await this.repo.findByIdAndUpdate(
        id,
        { name, permissions, department: departmentId, users },
        { new: true, session }
      );

      await session.commitTransaction();
      return res.status(200).json(new ApiResponse(200, updatedRole, "Role updated successfully"));
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  });

  Delete = AsyncHandler(async (req, res) => {
    const id = req.params.id;
    if (!id) {
      throw new ApiError(Types.Errors.UnprocessableData, "Role ID is required");
    }
    if (req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "You don't have permission to perform this action");
    }

    const deletedRole = await this.repo.findByIdAndDelete(id);

    if (!deletedRole) {
      throw new ApiError(Types.Errors.NotFound, "Role not found");
    }

    return res.status(200).json(new ApiResponse(200, deletedRole, "Role deleted successfully"));
  })

  Get = AsyncHandler(async (req, res) => {
    const id = req.params.id;
    if (id) {
      const role = await this.repo
        .findById(id)
        .populate("department", "name")
        .populate("users", "firstName lastName email role");
      if (!role) {
        throw new ApiError(Types.Errors.NotFound, "Role not found");
      }
      return res.status(200).json(new ApiResponse(200, role, "Role retrieved successfully"));
    }
    const departmentFilter = req.query.departmentId;
    const filter = departmentFilter ? { department: departmentFilter } : {};

    const roles = await this.repo.find(filter).populate("department", "name");
    return res.status(200).json(new ApiResponse(200, roles, "Roles retrieved successfully"));
  });

  GetRoles = AsyncHandler(async (req, res) => {
    if (req.user.role === "HR") {
      return res.status(200).json(new ApiResponse(200, [], "HR have already all permissions"));
    }
  });
}


export default PermissionsController;
