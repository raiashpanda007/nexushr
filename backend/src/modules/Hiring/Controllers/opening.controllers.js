import { AsyncHandler, ApiError, ApiResponse } from "../../../utils/index.js";
import Types from "../../../types/index.js";
import mongoose from "mongoose";
import OpeningModel from "../Models/openings.model.js";
import UserModel from "../../Users/models/users.models.js";
import QuestionModel from "../Models/questions.model.js";
import RoundsModel from "../Models/rounds.model.js";
import ApplicantModel from "../Models/applicants.model.js";

class OpeningsController {
  constructor() {
    this.repo = OpeningModel;
  }
  Create = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can create openings");
    }
    const parsedData = Types.Openings.Create.safeParse(req.body);
    if (!parsedData.success) {
      throw new ApiError(
        Types.Errors.BadRequest,
        "Invalid data",
        parsedData.error.format(),
      );
    }
    const openingData = parsedData.data;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const hiringManager = await UserModel.findById(
        openingData.HiringManager,
      ).session(session);
      if (!hiringManager) {
        throw new ApiError(Types.Errors.NotFound, "Hiring manager not found");
      }

      let questionIds = [];
      if (
        Array.isArray(openingData.questions) &&
        openingData.questions.length > 0
      ) {
        const questionsToCreate = openingData.questions.map((question) => ({
          questionText: question.question,
          questionType: question.type,
          options: question.options || [],
        }));

        const createdQuestions = await QuestionModel.create(questionsToCreate, {
          session,
          ordered: true,
        });
        questionIds = createdQuestions.map((question) => question._id);
      }

      let roundIds = [];
      if (Array.isArray(openingData.rounds) && openingData.rounds.length > 0) {
        const createdRounds = await RoundsModel.create(openingData.rounds, {
          session,
          ordered: true,
        });
        roundIds = createdRounds.map((round) => round._id);
      }

      const [opening] = await OpeningModel.create(
        [
          {
            title: openingData.title,
            description: openingData.description,
            departmentId: openingData.departmentId,
            skills: openingData.skills || [],
            HiringManager: openingData.HiringManager,
            Status: openingData.status,
            note: openingData.note,
            expectedJoiningDate: openingData.expectedJoiningDate,
            salaryRange: openingData.salaryRange,
            questions: questionIds,
            rounds: roundIds,
          },
        ],
        { session },
      );

      await session.commitTransaction();
      return res
        .status(201)
        .json(new ApiResponse(201, opening, "Opening created successfully"));
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  });

  Get = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR" ){
        throw new ApiError(Types.Errors.Forbidden, "Only HR can view openings");
    }
    const openingId = req.params.id;
    if (!openingId) {
      const { page: pageQuery, limit: limitQuery, departmentId } = req.query;
      let limit = parseInt(limitQuery) || 10;
      let page = parseInt(pageQuery) || 1;
      if (limit > 100) limit = 100;

      const skip = (page - 1) * limit;
      const filter = {};
      if (departmentId) {
        filter.departmentId = departmentId;
      }

      let queryOptions = this.repo
        .find(filter)
        .populate("departmentId", "name")
        .populate("HiringManager", "firstName lastName email")
        .populate("questions")
        .populate("rounds")
        .populate("applicants", "name email phone status currentRound");

      if (limitQuery !== "all") {
        queryOptions = queryOptions.skip(skip).limit(limit);
      }

      const openings = await queryOptions;
      const total = await this.repo.countDocuments(filter);

      return res
        .status(200)
        .json(
          new ApiResponse(
          200,
          { data: openings, total, page, limit: limitQuery === "all" ? total : limit },
          "Openings retrieved successfully",
          ),
        );
    }
    const opening = await this.repo
      .findById(openingId)
      .populate("departmentId", "name")
      .populate("HiringManager", "firstName lastName email")
      .populate("questions")
      .populate("rounds")
      .populate("applicants", "name email phone status");
    if (!opening) {
       throw new ApiError(Types.Errors.NotFound, "Opening not found"); 
    }
    return res
      .status(200)
      .json(new ApiResponse(200, opening, "Opening retrieved successfully"));

  });

  Update = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
        throw new ApiError(Types.Errors.Forbidden, "Only HR can update openings");
    }
    const openingId = req.params.id;
    if (!openingId) {
      throw new ApiError(Types.Errors.BadRequest, "Opening ID is required");
    }
    const parsedData = Types.Openings.Update.safeParse(req.body);
    if (!parsedData.success) {
      throw new ApiError(
        Types.Errors.BadRequest,
        "Invalid data",
        parsedData.error.format(),
      );
    }
    const openingData = parsedData.data;

    const opening = await this.repo.findById(openingId);
    if (!opening) {
      throw new ApiError(Types.Errors.NotFound, "Opening not found");
    }

    await this.repo.findByIdAndUpdate(openingId, openingData, { new: true });
    return res
      .status(200)
      .json(new ApiResponse(200, opening, "Opening updated successfully"));
  });

  // Public endpoint - no auth required
  GetPublic = AsyncHandler(async (req, res) => {
    const openingId = req.params.id;
    if (!openingId) {
      throw new ApiError(Types.Errors.BadRequest, "Opening ID is required");
    }
    const opening = await this.repo
      .findById(openingId)
      .populate("departmentId", "name")
      .populate("HiringManager", "firstName lastName")
      .populate("questions")
      .select("-applicants");
    if (!opening) {
      throw new ApiError(Types.Errors.NotFound, "Opening not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, opening, "Opening retrieved successfully"));
  });

  Delete = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
        throw new ApiError(Types.Errors.Forbidden, "Only HR can delete openings");
    }
    const openingId = req.params.id;
    if (!openingId) {
      throw new ApiError(Types.Errors.BadRequest, "Opening ID is required");
    }
    const opening = await this.repo.findByIdAndDelete(openingId);
    if (!opening) {
      throw new ApiError(Types.Errors.NotFound, "Opening not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, opening, "Opening deleted successfully"));
  });
}

export default OpeningsController;
