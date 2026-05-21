import {
  AsyncHandler,
  ApiError,
  ApiResponse,
  buildDeptSnapshot,
  buildHiringManagerSnapshot,
  buildSkillNameMap,
  applySkillSnapshots,
} from "../../../utils/index.js";
import Types from "../../../types/index.js";
import mongoose from "mongoose";
import OpeningModel from "../Models/openings.model.js";
import UserModel from "../../Users/models/users.models.js";
import QuestionModel from "../Models/questions.model.js";
import RoundsModel from "../Models/rounds.model.js";
import ApplicantModel from "../Models/applicants.model.js";
import InterviewModel from "../Models/interview.model.js";
import DepartmentModel from "../../Departments/Models/departments.models.js";
import SkillModel from "../../Skills/models/skills.models.js";

// Transforms stored { round: doc, rank } pairs into a flat sorted Round array
const normalizeRounds = (rounds) =>
  (rounds || [])
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((r) => ({
      _id: r.round?._id || r.round,
      name: r.roundName || r.round?.name,
      description: r.roundDescription || r.round?.description,
      type: r.roundType || r.round?.type,
      rank: r.rank,
    }));

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

      const [department, skillDocs] = await Promise.all([
        DepartmentModel.findById(openingData.departmentId)
          .select("name")
          .lean(),
        SkillModel.find({ _id: { $in: (openingData.skills || []).map((s) => s.skillId) } })
          .select("name")
          .lean(),
      ]);

      const deptSnapshot = buildDeptSnapshot(department);
      const skillNameMap = buildSkillNameMap(skillDocs);
      const skillsSnapshot = applySkillSnapshots(openingData.skills || [], skillNameMap);
      const hiringManagerSnapshot = buildHiringManagerSnapshot(hiringManager);

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
        roundIds = createdRounds.map((round, idx) => ({
          round: round._id,
          rank: idx + 1,
          roundName: round.name,
          roundDescription: round.description,
          roundType: round.type,
        }));
      }

      const [opening] = await OpeningModel.create(
        [
          {
            title: openingData.title,
            description: openingData.description,
            departmentId: openingData.departmentId,
            departmentSnapshot: deptSnapshot,
            skills: skillsSnapshot,
            HiringManager: openingData.HiringManager,
            hiringManagerSnapshot,
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
    if (req.user.role !== "HR") {
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
        .sort({ createdAt: -1 })
        .lean();

      if (limitQuery !== "all") {
        queryOptions = queryOptions.skip(skip).limit(limit);
      }

      const openingsRaw = await queryOptions.lean();
      const openings = openingsRaw.map((o) => ({
        ...o,
        rounds: normalizeRounds(o.rounds),
      }));
      const total = await this.repo.countDocuments(filter);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              data: openings,
              total,
              page,
              limit: limitQuery === "all" ? total : limit,
            },
            "Openings retrieved successfully",
          ),
        );
    }
    const openingRaw = await this.repo
      .findById(openingId)
      .populate("questions")
      .lean();
    if (!openingRaw) {
      throw new ApiError(Types.Errors.NotFound, "Opening not found");
    }
    const opening = {
      ...openingRaw,
      rounds: normalizeRounds(openingRaw.rounds),
    };
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

    const updated = await this.repo.findByIdAndUpdate(openingId, openingData, { new: true }).lean();
    if (updated?.title && openingData.title) {
      await Promise.all([
        ApplicantModel.updateMany(
          { "openingSnapshot._id": updated._id },
          { $set: { "openingSnapshot.title": updated.title } },
        ),
        InterviewModel.updateMany(
          { "openingSnapshot._id": updated._id },
          { $set: { "openingSnapshot.title": updated.title } },
        ),
      ]);
    }
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
      .populate("questions")
      .select("-applicants")
      .lean();
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

  FilterApplicants = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(
        Types.Errors.Forbidden,
        "Only HR can filter applicants",
      );
    }

    const openingIdParam = req.params.id;
    if (!openingIdParam) {
      throw new ApiError(Types.Errors.BadRequest, "Opening ID is required");
    }

    const openingId = new mongoose.Types.ObjectId(openingIdParam);

    const filterParam = req.query.filter;
    if (!filterParam) {
      throw new ApiError(
        Types.Errors.BadRequest,
        "Filter parameter is required",
      );
    }

    if (filterParam === "score") {
      const scoreValue = parseFloat(req.query.value);

      if (isNaN(scoreValue)) {
        throw new ApiError(Types.Errors.BadRequest, "Invalid score value");
      }

      const result = await ApplicantModel.updateMany(
        {
          openingId,
          score: { $lt: scoreValue },
        },
        {
          $set: { status: "REJECTED" },
        },
      );

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            "Applicants filtered by score successfully",
          ),
        );
    } else if (filterParam === "rank") {
      const rankValue = parseInt(req.query.value);

      if (isNaN(rankValue) || rankValue <= 0) {
        throw new ApiError(Types.Errors.BadRequest, "Invalid rank value");
      }

      await ApplicantModel.aggregate([
        {
          $match: { openingId },
        },

        {
          $setWindowFields: {
            sortBy: { score: -1 },
            output: {
              rank: { $documentNumber: {} },
            },
          },
        },

        {
          $match: { rank: { $gt: rankValue } },
        },

        {
          $set: { status: "REJECTED" },
        },

        {
          $merge: {
            into: "applicants",
            whenMatched: "merge",
            whenNotMatched: "discard",
          },
        },
      ]);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            null,
            "Applicants filtered by rank successfully",
          ),
        );
    } else {
      throw new ApiError(
        Types.Errors.BadRequest,
        "Invalid filter type. Use 'score' or 'rank'",
      );
    }
  });
}

export default OpeningsController;
