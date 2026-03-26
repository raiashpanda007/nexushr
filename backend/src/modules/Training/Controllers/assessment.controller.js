import mongoose from "mongoose";
import AssesmentModel from "../Models/assessment.model.js";
import ChapterModel from "../Models/chapter.model.js";
import TrainingModel from "../Models/training.model.js";
import LessonModel from "../Models/lessons.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";

class AssessmentController {
  constructor() {
    this.repo = AssesmentModel;
  }

  Create = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can create assessments");
    }

    const parsedBody = Types.Assessments.Create.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Invalid data", parsedBody.error);
    }

    const assessment = await this.repo.create(parsedBody.data);
    return res.status(201).json(new ApiResponse(201, assessment, "Assessment created successfully"));
  });

  Update = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can update assessments");
    }

    const { uid } = req.params;
    if (!uid) {
      throw new ApiError(Types.Errors.BadRequest, "Assessment id is required");
    }

    const parsedBody = Types.Assessments.Update.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Invalid data", parsedBody.error);
    }

    const assessment = await this.repo.findByIdAndUpdate(uid, parsedBody.data, { new: true });
    if (!assessment) {
      throw new ApiError(Types.Errors.NotFound, "Assessment not found");
    }
    return res.status(200).json(new ApiResponse(200, assessment, "Assessment updated successfully"));
  });

  Delete = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can delete assessments");
    }

    const { uid } = req.params;
    if (!uid) {
      throw new ApiError(Types.Errors.BadRequest, "Assessment id is required");
    }

    const inUse = await ChapterModel.exists({ "assessments.assessmentId": new mongoose.Types.ObjectId(uid) });
    if (inUse) {
      throw new ApiError(409, "Assessment is referenced by one or more chapters and cannot be deleted");
    }

    const assessment = await this.repo.findByIdAndDelete(uid);
    if (!assessment) {
      throw new ApiError(Types.Errors.NotFound, "Assessment not found");
    }
    return res.status(200).json(new ApiResponse(200, assessment, "Assessment deleted successfully"));
  });

  Get = AsyncHandler(async (req, res) => {
    const { uid } = req.params;

    if (uid) {
      return this._getSingle(req, res, uid);
    }
    return this._getList(req, res);
  });

  _getSingle = async (req, res, uid) => {
    if (!mongoose.Types.ObjectId.isValid(uid)) {
      throw new ApiError(Types.Errors.BadRequest, "Invalid assessment id");
    }

    const assessment = await this.repo.findById(uid);
    if (!assessment) {
      throw new ApiError(Types.Errors.NotFound, "Assessment not found");
    }

    if (req.user.role !== "HR" && String(assessment.reviewer) !== String(req.user.id)) {
      // Employee: verify they have access via enrolled lesson → chapter
      const accessible = await this._isAccessibleByEmployee(uid, req.user.id);
      if (!accessible) {
        throw new ApiError(Types.Errors.Forbidden, "You do not have access to this assessment");
      }
    }

    return res.status(200).json(new ApiResponse(200, assessment, "Assessment fetched successfully"));
  };

  _getList = async (req, res) => {
    const { page: pageQuery, limit: limitQuery } = req.query;
    let limit = parseInt(limitQuery) || 10;
    let page = parseInt(pageQuery) || 1;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    if (req.user.role === "HR") {
      let query = this.repo.find().sort({ createdAt: -1 });
      if (limitQuery !== "all") query = query.skip(skip).limit(limit);
      const [assessments, total] = await Promise.all([query, this.repo.countDocuments()]);
      return res.status(200).json(
        new ApiResponse(200, { data: assessments, total, page, limit: limitQuery === "all" ? total : limit }, "Assessments fetched successfully")
      );
    }

    // Employee: only assessments in their enrolled chapters
    const accessibleIds = await this._getAccessibleAssessmentIds(req.user.id);
    const filter = { _id: { $in: accessibleIds } };
    let query = this.repo.find(filter).sort({ createdAt: -1 });
    if (limitQuery !== "all") query = query.skip(skip).limit(limit);
    const [assessments, total] = await Promise.all([query, this.repo.countDocuments(filter)]);
    return res.status(200).json(
      new ApiResponse(200, { data: assessments, total, page, limit: limitQuery === "all" ? total : limit }, "Assessments fetched successfully")
    );
  };

  _getAccessibleAssessmentIds = async (userId) => {
    const trainings = await TrainingModel.find({ students: new mongoose.Types.ObjectId(userId) }).select("Lessons");
    const lessonIds = trainings.flatMap((t) => (t.Lessons || []).map((l) => l._id || l));
    const lessons = await LessonModel.find({ _id: { $in: lessonIds } }).select("chapters");
    const chapterIds = lessons.flatMap((l) => l.chapters.map((c) => c.chapter));
    const chapters = await ChapterModel.find({ _id: { $in: chapterIds } }).select("assessments");
    return chapters.flatMap((c) => c.assessments.map((a) => a.assessmentId));
  };

  _isAccessibleByEmployee = async (assessmentId, userId) => {
    const ids = await this._getAccessibleAssessmentIds(userId);
    return ids.some((id) => String(id) === String(assessmentId));
  };
}

export default AssessmentController;
