import {
  ApiError,
  ApiResponse,
  AsyncHandler,
  GenerateUploadUrl,
  buildDeptSnapshot,
  buildUserSnapshot,
  buildSkillNameMap,
  applySkillSnapshots,
  buildHiringManagerSnapshot,
} from "../../../utils/index.js";
import UserModel from "../models/users.models.js";
import { SessionModel } from "../models/session.model.js";
import Types from "../../../types/index.js"
import { GenerateAccessToken, GenerateRefreshToken, VerifyRefreshToken } from "../Encrypts.js"
import bcrypt from "bcrypt";
import { v7 as uuid } from "uuid";
import DepartmentModel from "../../Departments/Models/departments.models.js";
import SkillModel from "../../Skills/models/skills.models.js";
import AttendanceModel from "../../Attendance/Models/attendance.model.js";
import LeaveBalanceModel from "../../Leaves/LeavesBalances/Models/leavesBalances.model.js";
import LeaveRequestModel from "../../Leaves/LeaveRequests/Models/leaveRequests.model.js";
import PayrollModel from "../../Payroll/Models/payroll.model.js";
import SalariesModel from "../../Salaries/Models/salaries.model.js";
import OpeningModel from "../../Hiring/Models/openings.model.js";
import InterviewModel from "../../Hiring/Models/interview.model.js";
import ApplicantModel from "../../Hiring/Models/applicants.model.js";

const getSkillNameMapForUser = async (skills) => {
  const skillIds = (skills || [])
    .map((s) => s?.skillId)
    .filter(Boolean);
  if (skillIds.length === 0) return new Map();

  const skillDocs = await SkillModel.find({ _id: { $in: skillIds } })
    .select("name")
    .lean();
  return buildSkillNameMap(skillDocs);
};

const syncUserSnapshots = async (userDoc) => {
  if (!userDoc) return;
  const userSnapshot = buildUserSnapshot(userDoc);
  const managerSnapshot = buildHiringManagerSnapshot(userDoc);

  await Promise.all([
    AttendanceModel.updateMany({ user: userDoc._id }, { $set: { userSnapshot } }),
    LeaveBalanceModel.updateMany({ user: userDoc._id }, { $set: { userSnapshot } }),
    LeaveRequestModel.updateMany({ requestedBy: userDoc._id }, { $set: { requestedBySnapshot: userSnapshot } }),
    LeaveRequestModel.updateMany({ respondedBy: userDoc._id }, { $set: { respondedBySnapshot: userSnapshot } }),
    PayrollModel.updateMany({ user: userDoc._id }, { $set: { userSnapshot } }),
    SalariesModel.updateMany({ userId: userDoc._id }, { $set: { userSnapshot } }),
    OpeningModel.updateMany({ HiringManager: userDoc._id }, { $set: { hiringManagerSnapshot: managerSnapshot } }),
    ApplicantModel.updateMany(
      { "openingSnapshot.hiringManagerId": userDoc._id },
      {
        $set: {
          "openingSnapshot.hiringManagerName":
            `${managerSnapshot.firstName || ""} ${managerSnapshot.lastName || ""}`.trim(),
          "openingSnapshot.hiringManagerEmail": managerSnapshot.email,
        },
      },
    ),
    InterviewModel.updateMany(
      { "openingSnapshot.hiringManagerId": userDoc._id },
      {
        $set: {
          "openingSnapshot.hiringManagerName":
            `${managerSnapshot.firstName || ""} ${managerSnapshot.lastName || ""}`.trim(),
          "openingSnapshot.hiringManagerEmail": managerSnapshot.email,
        },
      },
    ),
    InterviewModel.updateMany(
      { reviewers: userDoc._id },
      {
        $set: {
          "reviewersSnapshot.$[reviewer]": managerSnapshot,
        },
      },
      { arrayFilters: [{ "reviewer._id": userDoc._id }] },
    ),
  ]);
};


class UserController {
  constructor() {
    this.repo = UserModel;
  }
  CreateEmployee = AsyncHandler(async (req, res) => {

    if (!req.user || req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can create employee");
    }


    const parsedBody = Types.User.CreateEmp.safeParse(req.body);


    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.BadRequest, "Please provide valid data to create employee")
    }
    const { email, firstName, lastName, password, deptId, skills, profilePhoto, note } = parsedBody.data

    const [department, skillNameMap] = await Promise.all([
      DepartmentModel.findById(deptId).select("name").lean(),
      getSkillNameMapForUser(skills),
    ]);

    const deptSnapshot = buildDeptSnapshot(department);
    const skillsSnapshot = applySkillSnapshots(skills, skillNameMap);

    const savedUser = await UserModel.create({
      email: email,
      firstName: firstName,
      lastName: lastName,
      deptId: deptId,
      deptSnapshot,
      profilePhoto: profilePhoto,
      note: note,
      skills: skillsSnapshot,
      passwordHash: password,
      role: "EMPLOYEE"
    })


    console.log("SAVED USER :: ", savedUser);
    return res.status(201).json(new ApiResponse(201, savedUser, "Created employee"))

  })

  CreateHR = AsyncHandler(async (req, res) => {

    if (!req.user || req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can be created by HR");
    }

    const parsedBody = Types.User.CreateHR.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.BadRequest, "Please provide valid data to create a HR");
    }

    const { email, firstName, lastName, password, deptId, skills, profilePhoto, note } = parsedBody.data;

    const [department, skillNameMap] = await Promise.all([
      DepartmentModel.findById(deptId).select("name").lean(),
      getSkillNameMapForUser(skills),
    ]);

    const deptSnapshot = buildDeptSnapshot(department);
    const skillsSnapshot = applySkillSnapshots(skills, skillNameMap);

    const savedUser = await UserModel.create({
      email: email,
      firstName: firstName,
      lastName: lastName,
      deptId: deptId,
      deptSnapshot,
      profilePhoto: profilePhoto,
      note: note,
      skills: skillsSnapshot,
      passwordHash: password,
      role: "HR"
    })

    console.log("SAVED USER :: ", savedUser);
    return res.status(201).json(new ApiResponse(201, savedUser, "Created HR"))

  })

  Login = AsyncHandler(async (req, res) => {
    const parsedBody = Types.User.Login.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.BadRequest, "Please provide valid data to login");
    }

    const { email, password } = parsedBody.data;

    const savedUserDetail = await UserModel.findOne({ email }).select("+passwordHash");

    if (!savedUserDetail) {
      throw new ApiError(Types.Errors.NotFound, "User not found");
    }

    const isValid = await bcrypt.compare(password, savedUserDetail.passwordHash);

    if (!isValid) {
      throw new ApiError(Types.Errors.Forbidden, "Invalid password");
    }

    savedUserDetail.online = true;
    await savedUserDetail.save();
    const refreshUniqueToken = uuid()

    const refreshTokenPayload = {
      id: savedUserDetail._id,
      unique_token: refreshUniqueToken
    }

    const RefreshToken = GenerateRefreshToken(refreshTokenPayload);
    await SessionModel.create({ userId: savedUserDetail._id, token: RefreshToken });
    const AccessToken = GenerateAccessToken(email, savedUserDetail._id, savedUserDetail.firstName, savedUserDetail.lastName, savedUserDetail.role);

    const options = {
      httpOnly: true,
      secure: false
    };


    return res.status(200).cookie("accessToken", AccessToken, options).cookie("refreshToken", RefreshToken, options).json(new ApiResponse(200, {
      id: savedUserDetail._id,
      email: savedUserDetail.email,
      firstName: savedUserDetail.firstName,
      lastName: savedUserDetail.lastName,
      role: savedUserDetail.role,
      deptId: savedUserDetail.deptId,
      profilePhoto: savedUserDetail.profilePhoto,
      note: savedUserDetail.note,
      skills: savedUserDetail.skills,
    }, "Login successful"))

  })

  LogOut = AsyncHandler(async (req, res) => {

    const options = {
      httpOnly: true,
      secure: false
    };

    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "Logout successful"))

  })

  GetUsers = AsyncHandler(async (req, res) => {
    const userID = req.params.id;

    if (req.user.role === "HR") {
      if (!userID) {
        const { page: pageQuery, limit: limitQuery } = req.query;
        let limit = parseInt(limitQuery) || 10;
        let page = parseInt(pageQuery) || 1;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;

        const users = await UserModel.find()
          .sort({ _id: -1 })
          .select("-passwordHash")
          .skip(skip)
          .limit(limit)
          .lean();

        const total = await UserModel.countDocuments();

        return res
          .status(200)
          .json(new ApiResponse(200, { data: users, total, page, limit }, "All users fetched successfully"));
      }

      const user = await UserModel.findById(userID)
        .select("-passwordHash")
        .lean();

      if (!user) {
        throw new ApiError(Types.Errors.NotFound, "User not found");
      }

      return res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));
    }

    // EMPLOYEE

    if (!userID) {
      const user = await UserModel.findById(req.user.id)
        .select("-passwordHash")
        .lean();

      return res
        .status(200)
        .json(new ApiResponse(200, user, "User fetched successfully"));
    }

    throw new ApiError(
      Types.Errors.Forbidden,
      "You are not authorized to get this user"
    );
  });

  RefreshAccessToken = AsyncHandler(async (req, res) => {

    console.log("Refresh Token hit :: ");
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ApiError(Types.Errors.Unauthroized, "Unauthorized");
    }

    let decodedToken;
    try {
      decodedToken = VerifyRefreshToken(refreshToken);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        throw new ApiError(Types.Errors.Unauthroized, "Refresh token expired");
      }
      throw new ApiError(Types.Errors.Unauthroized, "Invalid refresh token");
    }

    if (!decodedToken) {
      throw new ApiError(Types.Errors.Unauthroized, "Unauthorized");
    }


    // Check if session exists
    const session = await SessionModel.findOne({ token: refreshToken });

    if (!session) {
      // Reuse detected - clear all sessions for this user
      await SessionModel.deleteMany({ userId: decodedToken.id });

      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      throw new ApiError(Types.Errors.Forbidden, "Refresh token reuse detected. Please login again.");
    }

    // Delete the used session
    await SessionModel.findByIdAndDelete(session._id);

    const user = await UserModel.findById(decodedToken.id);
    if (!user) {
      throw new ApiError(Types.Errors.NotFound, "User not found");
    }

    const newRefreshUniqueToken = uuid();
    const newRefreshTokenPayload = {
      id: user._id,
      unique_token: newRefreshUniqueToken
    };

    const newRefreshToken = GenerateRefreshToken(newRefreshTokenPayload);
    const newAccessToken = GenerateAccessToken(user.email, user._id, user.firstName, user.lastName, user.role);

    // Create new session
    await SessionModel.create({ userId: user._id, token: newRefreshToken });

    const options = {
      httpOnly: true,
      secure: false
    };

    return res.status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        deptId: user.deptId,
        profilePhoto: user.profilePhoto,
        note: user.note,
        skills: user.skills,
        refreshUniqueToken: newRefreshUniqueToken
      }, "Access token refreshed successfully"))
  })


  UpdateEmployee = AsyncHandler(async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
      throw new ApiError(Types.Errors.BadRequest, "User ID is required");
    }

    const parsedBody = Types.User.UserUpdates.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.BadRequest, "Please provide valid data to update user");
    }

    if (req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "You are not authorized to update this user");
    }

    const { email, firstName, lastName, deptId, skills, profilePhoto, note } = parsedBody.data;

    const user = await UserModel.findById(userId).select("+passwordHash");
    if (!user) {
      throw new ApiError(Types.Errors.NotFound, "User not found");
    }

    let deptSnapshot = user.deptSnapshot;
    if (deptId) {
      const department = await DepartmentModel.findById(deptId).select("name").lean();
      deptSnapshot = buildDeptSnapshot(department);
      user.deptId = deptId;
      user.deptSnapshot = deptSnapshot;
    }

    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    if (skills) {
      const skillNameMap = await getSkillNameMapForUser(skills);
      user.skills = applySkillSnapshots(skills, skillNameMap);
    }
    if (profilePhoto !== undefined) {
      user.profilePhoto = profilePhoto;
    }
    if (note !== undefined) {
      user.note = note;
    }

    await user.save();

    const shouldSyncSnapshots = Boolean(
      email || firstName || lastName || profilePhoto || deptId,
    );
    if (shouldSyncSnapshots) {
      await syncUserSnapshots(user);
    }

    user.passwordHash = undefined;

    return res.status(200).json(new ApiResponse(200, user, "User updated successfully"));
  })

  DeleteEmployee = AsyncHandler(async (req, res) => {
    const userId = req.params.id;
    if (!userId) {
      throw new ApiError(Types.Errors.BadRequest, "User ID is required");
    }

    if (req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "You are not authorized to delete this user");
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new ApiError(Types.Errors.NotFound, "User not found");
    }

    await user.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "User deleted successfully"));
  })

  GetSignedURL = AsyncHandler(async (req, res) => {
    const { fileName, contentType } = req.query;
    if (!fileName || !contentType) {
      throw new ApiError(Types.Errors.BadRequest, "fileName and contentType are required");
    }

    const signedUrl = await GenerateUploadUrl(fileName, contentType, "register-photos");

    return res.status(200).json(new ApiResponse(200, { signedUrl }, "Signed URL generated successfully"));
  })

}

export default UserController;
