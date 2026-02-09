import { ApiError, ApiResponse, AsyncHandler } from "../../../utils/index.js";
import { UserModel } from "../users.models.js";
import Types from "../../../types/index.js"
import { HashPassword, GenerateAccessToken, GenerateRefreshToken, VerifyRefreshToken } from "../Encrypts.js"
import bcrypt from "bcrypt";
import { v7 as uuid } from "uuid";

class UserController {
  constructor() {
    this.repo = UserModel;
  }
  CreateEmployee = AsyncHandler(async (req, res) => {

    if (!req.user || req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR created by HR");
    }


    const parsedBody = Types.User.CreateEmp.safeParse(req.body);


    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.BadRequest, "Please provide valid data to create employee")
    }



    const { email, firstName, lastName, password, deptId, skills, profilePhoto, note } = parsedBody.data


    const savedUser = await UserModel.create({
      email: email,
      firstName: firstName,
      lastName: lastName,
      deptId: deptId,
      profilePhoto: profilePhoto,
      note: note,
      skills: skills,
      passwordHash: password, // Model pre-save hook handles hashing
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



    const savedUser = await UserModel.create({
      email: email,
      firstName: firstName,
      lastName: lastName,
      deptId: deptId,
      profilePhoto: profilePhoto,
      note: note,
      skills: skills,
      passwordHash: password, // Model pre-save hook handles hashing
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

    const savedUserDetail = await UserModel.findOne({ email }).select("+passwordHash +refreshTokens");
    // console.log("SAVED USER DETAIL :: ", savedUserDetail);
    console.log("PASSWORD :: ", password);
    console.log("PASSWORD HASH :: ", savedUserDetail.passwordHash);
    const isValid = await bcrypt.compare(password, savedUserDetail.passwordHash);

    if (!isValid) {
      throw new ApiError(Types.Errors.Forbidden, "Invalid password");
    }

    const refreshUniqueToken = uuid()

    const refreshTokenPayload = {
      id: savedUserDetail._id,
      unique_token: refreshUniqueToken
    }

    const RefreshToken = GenerateRefreshToken(refreshTokenPayload);
    if (!savedUserDetail.refreshTokens) {
      savedUserDetail.refreshTokens = [];
    }
    savedUserDetail.refreshTokens.push({ token: RefreshToken });
    await savedUserDetail.save();
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
        const users = await UserModel.find();
        return res.status(200).json(new ApiResponse(200, users, "All users fetched successfully"));
      }
      const user = await UserModel.findById(userID);
      if (!user) {
        throw new ApiError(Types.Errors.NotFound, "User not found");
      }
      return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
    }

    if (!userID) {
      const user = await UserModel.findById(req.user.id);
      return res.status(200).json(new ApiResponse(200, user, "User fetched successfully"));
    }

    throw new ApiError(Types.Errors.Forbidden, "You are not authorized to get this user");
  })


  RefreshAccessToken = AsyncHandler(async (req, res) => {

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new ApiError(Types.Errors.Unauthorized, "Unauthorized");
    }

    let decodedToken;
    try {
      decodedToken = VerifyRefreshToken(refreshToken);
    } catch (error) {
      throw new ApiError(Types.Errors.Unauthorized, "Invalid Refresh Token");
    }

    if (!decodedToken) {
      throw new ApiError(Types.Errors.Unauthorized, "Unauthorized");
    }

    const user = await UserModel.findById(decodedToken.id).select("+refreshTokens");
    if (!user) {
      throw new ApiError(Types.Errors.NotFound, "User not found");
    }

    // Check if the token exists in the DB
    if (!user.refreshTokens) user.refreshTokens = [];
    const tokenIndex = user.refreshTokens.findIndex(rt => rt.token === refreshToken);

    if (tokenIndex === -1) {
      // Token reuse detected! Potential theft. 
      // Invalidate all tokens for this user.
      user.refreshTokens = [];
      await user.save();

      // Clear cookies
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      throw new ApiError(Types.Errors.Forbidden, "Refresh token reuse detected. Please login again.");
    }

    // Token Rotation: Remove the old token from DB
    user.refreshTokens.splice(tokenIndex, 1);

    // Generate NEW tokens
    const newRefreshUniqueToken = uuid();
    const newRefreshTokenPayload = {
      id: user._id,
      unique_token: newRefreshUniqueToken
    };

    const newRefreshToken = GenerateRefreshToken(newRefreshTokenPayload);
    const newAccessToken = GenerateAccessToken(user.email, user._id, user.firstName, user.lastName, user.role);

    // Save NEW refresh token to DB
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

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
}

export default UserController;
