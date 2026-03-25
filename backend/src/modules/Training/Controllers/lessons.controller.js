import mongoose from "mongoose";
import LessonModel from "../Models/lessons.model.js";
import ChapterModel from "../Models/chapter.model.js";
import VideosModel from "../Models/videos.model.js";
import TrainingModel from "../Models/training.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import { GenerateUploadUrl } from "../../../utils/Upload.js";
import Types from "../../../types/index.js";

const RESOURCE_ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const VIDEO_ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

class LessonController {
  constructor() {
    this.repo = LessonModel;
  }

  Create = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can create lessons");
    }

    const parsedBody = Types.Lessons.Create.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(
        Types.Errors.UnprocessableData,
        "Invalid data",
        parsedBody.error
      );
    }
    const { name, description, chapters } = parsedBody.data;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const rankedChapters = [];

      for (let i = 0; i < chapters.length; i++) {
        const {
          name: chapterName,
          description: chapterDesc,
          pdfResources,
          docxResources,
          textResources,
          linkResources,
          videoLecture,
          assessments,
        } = chapters[i];

        let videoId = undefined;
        if (videoLecture) {
          const [video] = await VideosModel.create(
            [{ name: videoLecture.name, versions: videoLecture.versions, metadata: videoLecture.metadata }],
            { session }
          );
          videoId = video._id;
        }

        const [chapter] = await ChapterModel.create(
          [
            {
              name: chapterName,
              description: chapterDesc,
              pdfResources: pdfResources ?? [],
              docxResources: docxResources ?? [],
              textResources: textResources ?? [],
              linkResources: linkResources ?? [],
              videoLecture: videoId,
              assessments: assessments ?? [],
            },
          ],
          { session }
        );

        rankedChapters.push({ rank: i + 1, chapter: chapter._id });
      }

      const [lesson] = await LessonModel.create(
        [{ name, description, chapters: rankedChapters }],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return res
        .status(201)
        .json(new ApiResponse(201, lesson, "Lesson created successfully"));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  });

  Delete = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can delete lessons");
    }

    const { uid } = req.params;
    if (!uid) {
      throw new ApiError(Types.Errors.BadRequest, "Lesson id is required");
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const lesson = await LessonModel.findById(uid).session(session);
      if (!lesson) {
        throw new ApiError(Types.Errors.NotFound, "Lesson not found");
      }

      const chapterIds = lesson.chapters.map((c) => c.chapter);

      // Delete associated video docs
      const chapterDocs = await ChapterModel.find({
        _id: { $in: chapterIds },
      }).session(session);
      const videoIds = chapterDocs
        .map((c) => c.videoLecture)
        .filter(Boolean);
      if (videoIds.length > 0) {
        await VideosModel.deleteMany({ _id: { $in: videoIds } }, { session });
      }

      await ChapterModel.deleteMany({ _id: { $in: chapterIds } }, { session });
      await LessonModel.findByIdAndDelete(uid, { session });

      await session.commitTransaction();
      session.endSession();

      return res
        .status(200)
        .json(new ApiResponse(200, lesson, "Lesson deleted successfully"));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  });

  Update = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can update lessons");
    }

    const { uid } = req.params;
    if (!uid) {
      throw new ApiError(Types.Errors.BadRequest, "Lesson id is required");
    }

    const parsedBody = Types.Lessons.Update.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(
        Types.Errors.UnprocessableData,
        "Invalid data",
        parsedBody.error
      );
    }
    const { name, description, chapters } = parsedBody.data;

    // No chapter replacement — simple metadata update
    if (!chapters) {
      const lesson = await LessonModel.findByIdAndUpdate(
        uid,
        { ...(name && { name }), ...(description && { description }) },
        { new: true }
      );
      if (!lesson) {
        throw new ApiError(Types.Errors.NotFound, "Lesson not found");
      }
      return res
        .status(200)
        .json(new ApiResponse(200, lesson, "Lesson updated successfully"));
    }

    // Chapter replacement — needs transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const lesson = await LessonModel.findById(uid).session(session);
      if (!lesson) {
        throw new ApiError(Types.Errors.NotFound, "Lesson not found");
      }

      // Delete old chapters and their videos
      const oldChapterIds = lesson.chapters.map((c) => c.chapter);
      const oldChapterDocs = await ChapterModel.find({
        _id: { $in: oldChapterIds },
      }).session(session);
      const oldVideoIds = oldChapterDocs
        .map((c) => c.videoLecture)
        .filter(Boolean);
      if (oldVideoIds.length > 0) {
        await VideosModel.deleteMany(
          { _id: { $in: oldVideoIds } },
          { session }
        );
      }
      await ChapterModel.deleteMany(
        { _id: { $in: oldChapterIds } },
        { session }
      );

      // Create new chapters
      const rankedChapters = [];
      for (let i = 0; i < chapters.length; i++) {
        const {
          name: chapterName,
          description: chapterDesc,
          pdfResources,
          docxResources,
          textResources,
          linkResources,
          videoLecture,
          assessments,
        } = chapters[i];

        let videoId = undefined;
        if (videoLecture) {
          const [video] = await VideosModel.create(
            [{ name: videoLecture.name, versions: videoLecture.versions, metadata: videoLecture.metadata }],
            { session }
          );
          videoId = video._id;
        }

        const [chapter] = await ChapterModel.create(
          [
            {
              name: chapterName,
              description: chapterDesc,
              pdfResources: pdfResources ?? [],
              docxResources: docxResources ?? [],
              textResources: textResources ?? [],
              linkResources: linkResources ?? [],
              videoLecture: videoId,
              assessments: assessments ?? [],
            },
          ],
          { session }
        );

        rankedChapters.push({ rank: i + 1, chapter: chapter._id });
      }

      lesson.chapters = rankedChapters;
      if (name) lesson.name = name;
      if (description) lesson.description = description;
      await lesson.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res
        .status(200)
        .json(new ApiResponse(200, lesson, "Lesson updated successfully"));
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  });

  GetSignedURL = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(
        Types.Errors.Forbidden,
        "Only HR can upload training resources"
      );
    }

    const { fileName, contentType, resourceType } = req.body;
    if (!fileName || !contentType || !resourceType) {
      throw new ApiError(
        Types.Errors.BadRequest,
        "fileName, contentType, and resourceType are required"
      );
    }

    let bucket;
    if (resourceType === "resource") {
      if (!RESOURCE_ALLOWED_TYPES.includes(contentType)) {
        throw new ApiError(
          Types.Errors.BadRequest,
          "Only PDF and DOCX files are allowed for resources"
        );
      }
      bucket = "resources";
    } else if (resourceType === "video") {
      if (!VIDEO_ALLOWED_TYPES.includes(contentType)) {
        throw new ApiError(
          Types.Errors.BadRequest,
          "Only MP4, WebM, and MOV files are allowed for videos"
        );
      }
      bucket = "training-videos";
    } else {
      throw new ApiError(
        Types.Errors.BadRequest,
        "resourceType must be 'resource' or 'video'"
      );
    }

    const key = `${Date.now()}-${fileName}`;
    const signedUrl = await GenerateUploadUrl(key, contentType, bucket);

    return res.status(200).json(
      new ApiResponse(200, { signedUrl, key }, "Signed URL generated successfully")
    );
  });

  Get = AsyncHandler(async (req, res) => {
    const { uid } = req.params;

    if (!uid) {
      return this._getList(req, res);
    }
    return this._getSingle(req, res, uid);
  });

  _getList = async (req, res) => {
    const { page: pageQuery, limit: limitQuery } = req.query;
    let limit = parseInt(limitQuery) || 10;
    let page = parseInt(pageQuery) || 1;
    if (limit > 100) limit = 100;
    const skip = (page - 1) * limit;

    if (req.user.role === "HR") {
      const pipeline = [
        { $skip: skip },
        { $limit: limit },
        {
          $addFields: {
            chaptersCount: { $size: { $ifNull: ["$chapters", []] } },
          },
        },
        { $project: { chapters: 0 } },
      ];

      if (limitQuery === "all") {
        pipeline.shift();
        pipeline.shift();
      }

      const [lessons, total] = await Promise.all([
        LessonModel.aggregate(pipeline),
        LessonModel.countDocuments(),
      ]);

      return res.status(200).json(
        new ApiResponse(
          200,
          { data: lessons, total, page, limit: limitQuery === "all" ? total : limit },
          "Lessons fetched successfully"
        )
      );
    }

    // Employee: only lessons from their assigned trainings
    const trainings = await TrainingModel.find({
      students: new mongoose.Types.ObjectId(req.user.id),
    }).select("Lessons");

    const lessonIds = trainings.flatMap((t) =>
      (t.Lessons || []).map((l) => (l._id || l))
    );

    const pipeline = [
      { $match: { _id: { $in: lessonIds } } },
      {
        $lookup: {
          from: "userprogresses",
          let: { lessonId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$lesson", "$$lessonId"] },
                    { $eq: ["$user", new mongoose.Types.ObjectId(req.user.id)] },
                  ],
                },
              },
            },
          ],
          as: "progress",
        },
      },
      {
        $unwind: {
          path: "$progress",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          chaptersCount: { $size: { $ifNull: ["$chapters", []] } },
          completedChaptersCount: {
            $size: { $ifNull: ["$progress.completedChapters", []] },
          },
          status: { $ifNull: ["$progress.status", "not_started"] },
        },
      },
      { $project: { chapters: 0, progress: 0 } },
    ];

    const fullPipeline = limitQuery === "all"
      ? pipeline
      : [
          ...pipeline.slice(0, 1),
          { $skip: skip },
          { $limit: limit },
          ...pipeline.slice(1),
        ];

    const [lessons, total] = await Promise.all([
      LessonModel.aggregate(fullPipeline),
      LessonModel.countDocuments({ _id: { $in: lessonIds } }),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        { data: lessons, total, page, limit: limitQuery === "all" ? total : limit },
        "Lessons fetched successfully"
      )
    );
  };

  _getSingle = async (req, res, uid) => {
    if (!mongoose.Types.ObjectId.isValid(uid)) {
      throw new ApiError(Types.Errors.BadRequest, "Invalid lesson id");
    }

    // For employees, verify access
    if (req.user.role !== "HR") {
      const training = await TrainingModel.findOne({
        students: new mongoose.Types.ObjectId(req.user.id),
        Lessons: new mongoose.Types.ObjectId(uid),
      });
      if (!training) {
        throw new ApiError(
          Types.Errors.Forbidden,
          "You do not have access to this lesson"
        );
      }
    }

    const chapterExpansionPipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(uid) } },
      {
        $unwind: {
          path: "$chapters",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "chapters",
          localField: "chapters.chapter",
          foreignField: "_id",
          as: "chapterDetails",
        },
      },
      {
        $unwind: {
          path: "$chapterDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "chapterDetails.videoLecture",
          foreignField: "_id",
          as: "chapterDetails.videoLecture",
        },
      },
      {
        $unwind: {
          path: "$chapterDetails.videoLecture",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "chapterDetails.rank": "$chapters.rank",
        },
      },
      { $sort: { "chapterDetails.rank": 1 } },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          description: { $first: "$description" },
          createdAt: { $first: "$createdAt" },
          updatedAt: { $first: "$updatedAt" },
          chapters: { $push: "$chapterDetails" },
        },
      },
    ];

    // For employees, append progress lookup
    if (req.user.role !== "HR") {
      chapterExpansionPipeline.push(
        {
          $lookup: {
            from: "userprogresses",
            let: { lessonId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$lesson", "$$lessonId"] },
                      {
                        $eq: [
                          "$user",
                          new mongoose.Types.ObjectId(req.user.id),
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: "progress",
          },
        },
        {
          $unwind: {
            path: "$progress",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            status: { $ifNull: ["$progress.status", "not_started"] },
            currentChapter: "$progress.currentChapter",
            completedChapters: {
              $ifNull: ["$progress.completedChapters", []],
            },
          },
        },
        { $project: { progress: 0 } }
      );
    }

    const [lesson] = await LessonModel.aggregate(chapterExpansionPipeline);

    if (!lesson) {
      throw new ApiError(Types.Errors.NotFound, "Lesson not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, lesson, "Lesson fetched successfully"));
  };
}

export default LessonController;
