import mongoose from "mongoose";
import ChapterModel from "../Models/chapter.model.js";
import LessonModel from "../Models/lessons.model.js";
import VideosModel from "../Models/videos.model.js";
import UserProgressModel from "../Models/userProgress.model.js";
import TrainingModel from "../Models/training.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";

class ChapterController {
  constructor() {
    this.repo = ChapterModel;
  }

  _normalizeVideoVersions = (videoLecture) => {
    if (!videoLecture) return null;
    let url = videoLecture.url;

    if (!url && Array.isArray(videoLecture.versions) && videoLecture.versions.length > 0) {
      const first = videoLecture.versions[0];
      if (typeof first === "string") {
        url = first;
      } else if (first && typeof first === "object" && typeof first.url === "string") {
        url = first.url;
      }
    }

    if (!url) return null;

    return [
      {
        "240p": "",
        "360p": "",
        "720p": "",
        "1080p": "",
        "default": url,
      },
    ];
  };

  Create = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can create chapters");
    }

    const parsedBody = Types.Chapters.Create.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Invalid data", parsedBody.error);
    }

    const {
      lessonId, name, description,
      pdfResources, docxResources, textResources, linkResources,
      videoLecture, assessments, rank
    } = parsedBody.data;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const lesson = await LessonModel.findById(lessonId).session(session);
      if (!lesson) {
        throw new ApiError(Types.Errors.NotFound, "Lesson not found");
      }

      let videoId;
      if (videoLecture) {
        const versions = this._normalizeVideoVersions(videoLecture);
        if (!versions) {
          throw new ApiError(Types.Errors.UnprocessableData, "Video URL is required");
        }
        const [video] = await VideosModel.create(
          [{ name: videoLecture.name, versions, metadata: videoLecture.metadata }],
          { session }
        );
        videoId = video._id;
      }

      const chapterRank = rank ?? (lesson.chapters.length + 1);

      const [chapter] = await ChapterModel.create(
        [{
          name, description,
          pdfResources: pdfResources ?? [],
          docxResources: docxResources ?? [],
          textResources: textResources ?? [],
          linkResources: linkResources ?? [],
          videoLecture: videoId,
          assessments: assessments ?? [],
        }],
        { session }
      );

      await LessonModel.updateOne(
        { _id: lessonId },
        { $push: { chapters: { rank: chapterRank, chapter: chapter._id } } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(201).json(new ApiResponse(201, chapter, "Chapter created successfully"));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  });

  Update = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can update chapters");
    }

    const { uid } = req.params;
    if (!uid) {
      throw new ApiError(Types.Errors.BadRequest, "Chapter id is required");
    }

    const parsedBody = Types.Chapters.Update.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Invalid data", parsedBody.error);
    }

    const { videoLecture, ...rest } = parsedBody.data;

    // If videoLecture is being changed, use a transaction
    if (videoLecture !== undefined) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const chapter = await ChapterModel.findById(uid).session(session);
        if (!chapter) {
          throw new ApiError(Types.Errors.NotFound, "Chapter not found");
        }

        if (chapter.videoLecture) {
          await VideosModel.findByIdAndDelete(chapter.videoLecture, { session });
        }

        let newVideoId;
        if (videoLecture) {
          const versions = this._normalizeVideoVersions(videoLecture);
          if (!versions) {
            throw new ApiError(Types.Errors.UnprocessableData, "Video URL is required");
          }
          const [video] = await VideosModel.create(
            [{ name: videoLecture.name, versions, metadata: videoLecture.metadata }],
            { session }
          );
          newVideoId = video._id;
        }

        const updated = await ChapterModel.findByIdAndUpdate(
          uid,
          { ...rest, videoLecture: newVideoId ?? null },
          { new: true, session }
        );

        await session.commitTransaction();
        session.endSession();
        return res.status(200).json(new ApiResponse(200, updated, "Chapter updated successfully"));
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
    }

    const chapter = await ChapterModel.findByIdAndUpdate(uid, rest, { new: true });
    if (!chapter) {
      throw new ApiError(Types.Errors.NotFound, "Chapter not found");
    }
    return res.status(200).json(new ApiResponse(200, chapter, "Chapter updated successfully"));
  });

  Delete = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can delete chapters");
    }

    const { uid } = req.params;
    if (!uid) {
      throw new ApiError(Types.Errors.BadRequest, "Chapter id is required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const chapter = await ChapterModel.findById(uid).session(session);
      if (!chapter) {
        throw new ApiError(Types.Errors.NotFound, "Chapter not found");
      }

      if (chapter.videoLecture) {
        await VideosModel.findByIdAndDelete(chapter.videoLecture, { session });
      }

      await ChapterModel.findByIdAndDelete(uid, { session });

      await LessonModel.updateOne(
        { "chapters.chapter": new mongoose.Types.ObjectId(uid) },
        { $pull: { chapters: { chapter: new mongoose.Types.ObjectId(uid) } } },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json(new ApiResponse(200, chapter, "Chapter deleted successfully"));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  });

  Get = AsyncHandler(async (req, res) => {
    const { uid } = req.params;
    if (uid) return this._getSingle(req, res, uid);
    return this._getList(req, res);
  });

  _getSingle = async (req, res, uid) => {
    if (!mongoose.Types.ObjectId.isValid(uid)) {
      throw new ApiError(Types.Errors.BadRequest, "Invalid chapter id");
    }

    if (req.user.role !== "HR") {
      const enrolled = await this._checkEmployeeChapterAccess(uid, req.user.id);
      if (!enrolled) {
        throw new ApiError(Types.Errors.Forbidden, "You do not have access to this chapter");
      }
    }

    const [chapter] = await ChapterModel.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(uid) } },
      {
        $lookup: {
          from: "videos",
          localField: "videoLecture",
          foreignField: "_id",
          as: "videoLecture",
        },
      },
      { $unwind: { path: "$videoLecture", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "assesments",
          localField: "assessments.assessmentId",
          foreignField: "_id",
          as: "assessmentDocs",
        },
      },
      {
        $addFields: {
          assessments: {
            $map: {
              input: "$assessments",
              as: "a",
              in: {
                $mergeObjects: [
                  "$$a",
                  {
                    details: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: "$assessmentDocs",
                            as: "d",
                            cond: { $eq: ["$$d._id", "$$a.assessmentId"] },
                          },
                        },
                        0,
                      ],
                    },
                  },
                ],
              },
            },
          },
        },
      },
      { $project: { assessmentDocs: 0 } },
    ]);

    if (!chapter) {
      throw new ApiError(Types.Errors.NotFound, "Chapter not found");
    }
    return res.status(200).json(new ApiResponse(200, chapter, "Chapter fetched successfully"));
  };

  _getList = async (req, res) => {
    const { page: pageQuery, limit: limitQuery, lessonId } = req.query;
    let limit = parseInt(limitQuery) || 10;
    let page = parseInt(pageQuery) || 1;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    const matchStage = {};
    if (lessonId) {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        throw new ApiError(Types.Errors.BadRequest, "Invalid lessonId");
      }
      const lesson = await LessonModel.findById(lessonId).select("chapters");
      if (!lesson) throw new ApiError(Types.Errors.NotFound, "Lesson not found");
      const chapterIds = lesson.chapters.map((c) => c.chapter);
      matchStage._id = { $in: chapterIds };
    }

    if (req.user.role !== "HR") {
      // Employee: restrict to chapters in their enrolled lessons
      const accessibleIds = await this._getAccessibleChapterIds(req.user.id);
      if (matchStage._id) {
        matchStage._id.$in = matchStage._id.$in.filter((id) =>
          accessibleIds.some((aId) => String(aId) === String(id))
        );
      } else {
        matchStage._id = { $in: accessibleIds };
      }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "videos",
          localField: "videoLecture",
          foreignField: "_id",
          as: "videoLecture",
        },
      },
      { $unwind: { path: "$videoLecture", preserveNullAndEmptyArrays: true } },
    ];

    if (limitQuery !== "all") {
      pipeline.unshift({ $skip: skip }, { $limit: limit });
    }

    const [chapters, total] = await Promise.all([
      ChapterModel.aggregate([{ $match: matchStage }, ...pipeline.slice(pipeline.length - 2)]),
      ChapterModel.countDocuments(matchStage),
    ]);

    return res.status(200).json(
      new ApiResponse(200, { data: chapters, total, page, limit: limitQuery === "all" ? total : limit }, "Chapters fetched successfully")
    );
  };

  /**
   * POST /:uid/open
   * Employee marks a chapter as opened.
   * - No assessments → auto-complete
   * - Has assessments → in_progress
   */
  MarkOpened = AsyncHandler(async (req, res) => {
    if (req.user.role === "HR") {
      throw new ApiError(Types.Errors.Forbidden, "HR cannot mark chapters as opened");
    }

    const { uid } = req.params;
    if (!uid || !mongoose.Types.ObjectId.isValid(uid)) {
      throw new ApiError(Types.Errors.BadRequest, "Invalid chapter id");
    }

    const parsedBody = Types.Chapters.MarkOpened.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Invalid data", parsedBody.error);
    }
    const { lessonId } = parsedBody.data;

    // Verify enrollment
    const enrolled = await TrainingModel.exists({
      students: new mongoose.Types.ObjectId(req.user.id),
      Lessons: new mongoose.Types.ObjectId(lessonId),
    });
    if (!enrolled) {
      throw new ApiError(Types.Errors.Forbidden, "You are not enrolled in this lesson");
    }

    const chapter = await ChapterModel.findById(uid);
    if (!chapter) {
      throw new ApiError(Types.Errors.NotFound, "Chapter not found");
    }

    const lesson = await LessonModel.findById(lessonId).select("chapters");
    if (!lesson) {
      throw new ApiError(Types.Errors.NotFound, "Lesson not found");
    }
    const totalChapters = lesson.chapters.length;
    const allChapterIds = lesson.chapters.map((c) => String(c.chapter));

    const hasAssessments = chapter.assessments && chapter.assessments.length > 0;
    const now = new Date();

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Find or create UserProgress
      let progress = await UserProgressModel.findOne({
        user: new mongoose.Types.ObjectId(req.user.id),
        lesson: new mongoose.Types.ObjectId(lessonId),
      }).session(session);

      if (!progress) {
        [progress] = await UserProgressModel.create(
          [{ user: req.user.id, lesson: lessonId, status: "not_started", completedChapters: [], chapterProgress: [] }],
          { session }
        );
      }

      // Find chapterProgress entry
      let cpEntry = progress.chapterProgress.find((cp) => String(cp.chapter) === uid);
      if (!cpEntry) {
        progress.chapterProgress.push({ chapter: uid, status: "not_started", assessmentAttempts: [] });
        cpEntry = progress.chapterProgress[progress.chapterProgress.length - 1];
      }

      // Idempotent — already completed
      if (cpEntry.status === "completed") {
        await session.commitTransaction();
        session.endSession();
        return res.status(200).json(new ApiResponse(200, progress, "Chapter already completed"));
      }

      if (!cpEntry.openedAt) cpEntry.openedAt = now;
      progress.currentChapter = new mongoose.Types.ObjectId(uid);

      if (!hasAssessments) {
        // Auto-complete
        cpEntry.status = "completed";
        cpEntry.completedAt = now;
        const alreadyDone = progress.completedChapters.some((id) => String(id) === uid);
        if (!alreadyDone) {
          progress.completedChapters.push(new mongoose.Types.ObjectId(uid));
        }
      } else {
        cpEntry.status = "in_progress";
      }

      progress.status = "in_progress";
      if (progress.completedChapters.length === totalChapters &&
          allChapterIds.every((id) => progress.completedChapters.some((c) => String(c) === id))) {
        progress.status = "completed";
      }

      await progress.save({ session });
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json(new ApiResponse(200, progress, "Chapter opened successfully"));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  });

  _getAccessibleChapterIds = async (userId) => {
    const trainings = await TrainingModel.find({ students: new mongoose.Types.ObjectId(userId) }).select("Lessons");
    const lessonIds = trainings.flatMap((t) => (t.Lessons || []).map((l) => l._id || l));
    const lessons = await LessonModel.find({ _id: { $in: lessonIds } }).select("chapters");
    return lessons.flatMap((l) => l.chapters.map((c) => c.chapter));
  };

  _checkEmployeeChapterAccess = async (chapterId, userId) => {
    const ids = await this._getAccessibleChapterIds(userId);
    return ids.some((id) => String(id) === String(chapterId));
  };
}

export default ChapterController;
