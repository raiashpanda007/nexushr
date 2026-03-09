import mongoose from "mongoose";
import {
  AsyncHandler,
  ApiResponse,
  ApiError,
  GenerateUploadUrl,
} from "../../../utils/index.js";
import ApplicantModel from "../Models/applicants.model.js";
import OpeningModel from "../Models/openings.model.js";
import QuestionModel from "../Models/questions.model.js";
import RoundsModel from "../Models/rounds.model.js";

import Types from "../../../types/index.js";

class ApplicantController {
  constructor() {
    this.repo = ApplicantModel;
  }

  Create = AsyncHandler(async (req, res) => {
    const parsedData = Types.Applicants.Create.safeParse(req.body);
    if (!parsedData.success) {
      const errorMessages = (parsedData.error.issues ?? parsedData.error.errors ?? [])
        .map((err) => err.message)
        .join(", ");
      throw new ApiError(Types.Errors.BadRequest, `Validation failed: ${errorMessages}`);
    }
    const { name, email, phone, openingId, resumeUrl, questions } =
      parsedData.data;

    const opening = await OpeningModel.findById(openingId);
    if (!opening) {
      throw new ApiError(Types.Errors.NotFound, "Opening not found");
    }

    if (opening.Status !== "OPEN") {
      throw new ApiError(Types.Errors.BadRequest, "Cannot apply to a closed opening");
    }

    const existingApplicant = await ApplicantModel.findOne({
      email,
      openingId,
    });
    if (existingApplicant) {
      throw new ApiError(Types.Errors.BadRequest, "You have already applied for this opening");
    }

    // Validate that all opening questions are answered
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

    // Wrap applicant creation and opening update in a transaction
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
      const errorMessages = (parsedData.error.issues ?? parsedData.error.errors ?? [])
        .map((err) => err.message)
        .join(", ");
      throw new ApiError(Types.Errors.BadRequest, `Validation failed: ${errorMessages}`);
    }
    const { status, note } = parsedData.data;

    if (status) {
      applicant.Status = status;
    }
    if (note !== undefined) {
      applicant.note = note;
    }

    await applicant.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Application updated successfully"));
  });

  GetSignedURL = AsyncHandler(async (req, res) => {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      throw new ApiError(Types.Errors.BadRequest, "fileName and contentType are required");
    }

    if (contentType !== "application/pdf") {
      throw new ApiError(Types.Errors.BadRequest, "Only PDF files are allowed for resumes");
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
}

export default ApplicantController;
