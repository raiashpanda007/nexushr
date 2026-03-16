import UserModel from "../../Users/models/users.models.js";
import RolesModel from "../Models/roles.permissions.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";
class EmployeeRolesController {

  constructor() {
    this.userRepo = UserModel;
    this.rolesRepo = RolesModel;
  }

  Create = AsyncHandler(async (req, res) => {

    const parsedBody = Types.User.Roles.Create.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Please provide valid data", parsedBody.error);
    }
    const { firstName, lastName, email, password, skills, profilePhoto, note } = parsedBody.data;


    const savedUser = await this.userRepo.create({
      email: email,
      firstName: firstName,
      lastName: lastName,
      deptId: req.user.dept,
      profilePhoto: profilePhoto,
      note: note,
      skills: skills,
      passwordHash: password,
      role: "EMPLOYEE"
    })


    console.log("SAVED USER :: ", savedUser);
    return res.status(200).json(new ApiResponse(201, savedUser, "Created employee"));
  })

  Delete = AsyncHandler(async (req, res) => {

    const userId = req.params.id;
    if (!userId) {
      throw new ApiError(Types.Errors.BadRequest, "User ID is required");
    }
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new ApiError(Types.Errors.NotFound, "User not found");
    }

    await user.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));


  })

  Update = AsyncHandler(async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
      throw new ApiError(Types.Errors.BadRequest, "User ID is required");
    }

    const parsedBody = Types.User.Roles.Update.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.BadRequest, "Please provide valid data to update user");
    }


    const { email, firstName, lastName, skills, profilePhoto, note } = parsedBody.data;

    const user = await this.userRepo.findById(userId).select("+passwordHash");
    if (!user) {
      throw new ApiError(Types.Errors.NotFound, "User not found");
    }

    user.email = email;
    user.firstName = firstName;
    user.lastName = lastName;
    user.skills = skills;
    if (profilePhoto) {
      user.profilePhoto = profilePhoto;
    }
    if (note) {
      user.note = note;
    }

    await user.save();

    user.passwordHash = undefined;

    return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));

  })

  Get = AsyncHandler(async (req, res) => {
    const userId = req.params.id;
    if (userId) {
      const employee = await this.userRepo.findById(userId);
      if (!employee || employee.deptId !== req.user.dept) {
        throw new ApiError(Types.Errors.NotFound, "User not found or out of your search area");
      }

      return res.status(200).json(new ApiResponse(200, employee, "Employee found"));

    } else {
      const { page: pageQuery, limit: limitQuery } = req.query;
      let limit = parseInt(limitQuery) || 10;
      let page = parseInt(pageQuery) || 1;
      if (limit > 50) limit = 50;

      const skip = (page - 1) * limit;

      const users = await this.userRepo.find({ deptId: req.user.dept })
        .sort({ _id: -1 })
        .select("-passwordHash")
        .populate(populateOptions)
        .skip(skip)
        .limit(limit);

      const total = await this.userRepo.countDocuments();

      return res
        .status(200)
        .json(new ApiResponse(200, { data: users, total, page, limit }, "All users fetched successfully"));
    }

  });


  GetSignedURL = AsyncHandler(async (req, res) => {
    const { fileName, contentType } = req.query;
    if (!fileName || !contentType) {
      throw new ApiError(Types.Errors.BadRequest, "fileName and contentType are required");
    }

    const signedUrl = await GenerateUploadUrl(fileName, contentType, "register-photos");

    return res.status(200).json(new ApiResponse(200, { signedUrl }, "Signed URL generated successfully"));
  })

}


export default EmployeeRolesController;
