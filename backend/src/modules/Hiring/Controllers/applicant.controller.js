import mongoose from "mongoose";
import {
  AsyncHandler,
  ApiResponse,
  ApiError,
  GenerateUploadUrl,
} from "../../../utils/index.js";
import ApplicantModel from "../Models/applicants.model.js";
import OpeningModel from "../Models/openings.model.js";
import RedisClient from "../../../config/Redis.js";
import { Cfg } from "../../../config/env.js";

import Types from "../../../types/index.js";
import { SendResumeEvent } from "../../../queue/ats.queue.js";

class ApplicantController {
  constructor() {
    this.repo = ApplicantModel;
  }

  Create = AsyncHandler(async (req, res) => {
    const parsedData = Types.Applicants.Create.safeParse(req.body);
    if (!parsedData.success) {
      const errorMessages = (
        parsedData.error.issues ??
        parsedData.error.errors ??
        []
      )
        .map((err) => err.message)
        .join(", ");
      throw new ApiError(
        Types.Errors.BadRequest,
        `Validation failed: ${errorMessages}`,
      );
    }
    const { name, email, phone, openingId, resumeUrl, questions } =
      parsedData.data;

    const opening = await OpeningModel.findById(openingId);
    if (!opening) {
      throw new ApiError(Types.Errors.NotFound, "Opening not found");
    }

    if (opening.Status !== "OPEN") {
      throw new ApiError(
        Types.Errors.BadRequest,
        "Cannot apply to a closed opening",
      );
    }

    const existingApplicant = await ApplicantModel.findOne({
      email,
      openingId,
    });
    if (existingApplicant) {
      throw new ApiError(
        Types.Errors.BadRequest,
        "You have already applied for this opening",
      );
    }

    if (opening.questions.length > 0) {
      if (!questions || questions.length === 0) {
        throw new ApiError(
          Types.Errors.BadRequest,
          "This opening requires answers to all questions",
        );
      }

      const openingQuestionIds = opening.questions.map((q) => q.toString());
      const submittedQuestionIds = questions.map((q) => q.questionId);

      const missingQuestions = openingQuestionIds.filter(
        (id) => !submittedQuestionIds.includes(id),
      );
      if (missingQuestions.length > 0) {
        throw new ApiError(
          Types.Errors.BadRequest,
          `Missing answers for ${missingQuestions.length} required question(s)`,
        );
      }

      const extraQuestions = submittedQuestionIds.filter(
        (id) => !openingQuestionIds.includes(id),
      );
      if (extraQuestions.length > 0) {
        throw new ApiError(
          Types.Errors.BadRequest,
          "Submitted answers contain question(s) not belonging to this opening",
        );
      }
    }

    const session = await mongoose.startSession();
    let applicant;
    try {
      await session.withTransaction(async () => {
        [applicant] = await this.repo.create(
          [
            {
              name,
              email,
              phone,
              openingId,
              resume: resumeUrl,
              questions: questions ?? [],
            },
          ],
          { session },
        );

        await OpeningModel.findByIdAndUpdate(
          openingId,
          { $push: { applicants: applicant._id } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { applicantId: applicant._id },
          "Application submitted successfully",
        ),
      );
  });

  Delete = AsyncHandler(async (req, res) => {
    const { applicantId } = req.params;

    // Fetch applicant first to get openingId
    const applicant = await this.repo.findById(applicantId);
    if (!applicant) {
      throw new ApiError(Types.Errors.NotFound, "Applicant not found");
    }

    // Wrap applicant deletion and opening update in a transaction
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await this.repo.findByIdAndDelete(applicantId, { session });

        await OpeningModel.findByIdAndUpdate(
          applicant.openingId,
          { $pull: { applicants: applicant._id } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Application deleted successfully"));
  });

  Update = AsyncHandler(async (req, res) => {
    const applicantId = req.params.applicantId;
    const applicant = await this.repo.findById(applicantId);
    if (!applicant) {
      throw new ApiError(Types.Errors.NotFound, "Applicant not found");
    }

    const parsedData = Types.Applicants.Update.safeParse(req.body);
    if (!parsedData.success) {
      const errorMessages = (
        parsedData.error.issues ??
        parsedData.error.errors ??
        []
      )
        .map((err) => err.message)
        .join(", ");
      throw new ApiError(
        Types.Errors.BadRequest,
        `Validation failed: ${errorMessages}`,
      );
    }
    const { status, note, currentRound } = parsedData.data;

    if (status) {
      applicant.status = status;
    }
    if (note !== undefined) {
      applicant.note = note;
    }
    if (currentRound !== undefined) {
      applicant.currentRound = currentRound;
    }

    await applicant.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Application updated successfully"));
  });

  GetSignedURL = AsyncHandler(async (req, res) => {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      throw new ApiError(
        Types.Errors.BadRequest,
        "fileName and contentType are required",
      );
    }

    if (contentType !== "application/pdf") {
      throw new ApiError(
        Types.Errors.BadRequest,
        "Only PDF files are allowed for resumes",
      );
    }

    const signedUrl = await GenerateUploadUrl(fileName, contentType, "resumes");
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { signedUrl },
          "Signed URL generated successfully",
        ),
      );
  });

  Get = AsyncHandler(async (req, res) => {
    const applicantId = req.params.applicantId;
    if (!applicantId) {
      const status = req.query.status;
      const openingId = req.query.openingId;
      const roundId = req.query.roundId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      if (!openingId) {
        throw new ApiError(
          Types.Errors.BadRequest,
          "openingId query parameter is required to filter applicants",
        );
      }

      const filter = {};
      filter.openingId = openingId;
      if (status) {
        filter.Status = status;
      }

      if (roundId) {
        filter.currentRound = roundId;
      }

      const skip = (page - 1) * limit;
      const applicants = await this.repo
        .find(filter)
        .skip(skip)
        .limit(limit);

      const totalCount = await this.repo.countDocuments(filter);
      const totalPages = Math.ceil(totalCount / limit);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            {
              applicants,
              pagination: {
                currentPage: page,
                pageSize: limit,
                totalCount,
                totalPages,
              }
            },
            "Applicants retrieved successfully",
          ),
        );
    }
    const applicant = await this.repo
      .findById(applicantId)
      .populate({
        path: "openingId",
        select: "title description departmentId HiringManager rounds",
        populate: [
          {
            path: "departmentId",
            select: "name",
          },
          {
            path: "HiringManager",
            select: "firstName lastName email",
          },
          {
            path: "rounds.round",
            select: "name description type",
          },
        ],
      })
      .populate({
        path: "questions.questionId",
        select: "questionText",
      })
      .populate({
        path: "currentRound",
        select: "name description type",
      });
    if (!applicant) {
      throw new ApiError(Types.Errors.NotFound, "Applicant not found");
    }

    // Normalize rounds to flat sorted array
    const applicantObj = applicant.toObject();
    if (applicantObj.openingId?.rounds) {
      applicantObj.openingId.rounds = (applicantObj.openingId.rounds || [])
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .map(r => ({
          _id: r.round?._id,
          name: r.round?.name,
          description: r.round?.description,
          type: r.round?.type,
          rank: r.rank,
        }));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, { applicant: applicantObj }, "Applicant retrieved successfully"),
      );
  });

  GenerateATSscore = AsyncHandler(async (req, res) => {
    if (req.user.role != "HR") {
      throw new ApiError(Types.Errors.Unauthroized, "Only HR can generate ATS score");
    }
    const openingId = req.params.id;

    await SendResumeEvent(openingId);

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "ATS score generation initiated successfully. It may take a few moments for the scores to be updated.",
      ),
    );
  });

  GetATSResult = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can view ATS results");
    }

    const { openingId } = req.params;

    const redisInstance = RedisClient.GetInstance(Cfg.REDIS_URL);
    const client = redisInstance.GetClient();

    const MAX_WAIT_MS = 120_000; // 2 minutes max wait
    const POLL_INTERVAL_MS = 3_000; // check every 3 seconds
    const startTime = Date.now();
    const redisKey = `ats:result:${openingId}`;

    while (Date.now() - startTime < MAX_WAIT_MS) {
      const result = await client.get(redisKey);

      if (result !== null) {
        const rankedScores = JSON.parse(result);
        await client.del(redisKey);
        return res.status(200).json(
          new ApiResponse(200, { status: "ready", results: rankedScores }, "ATS results ready")
        );
      }

      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    }

    return res.status(200).json(
      new ApiResponse(200, { status: "pending" }, "ATS processing is still in progress, please try again shortly")
    );
  });
}

export default ApplicantController;
