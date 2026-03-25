import mongoose from "mongoose";
import UserProgressModel from "../Models/userProgress.model.js";
import AssesmentModel from "../Models/assessment.model.js";
import LessonModel from "../Models/lessons.model.js";
import ChapterModel from "../Models/chapter.model.js";
import TrainingModel from "../Models/training.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";

class UserProgressController {
  constructor() {
    this.repo = UserProgressModel;
  }

  /**
   * POST /progress/submit
   * Employee submits assessment answers for a chapter.
   * Grades the submission, records attempt, and potentially marks chapter complete.
   */
  SubmitAssessment = AsyncHandler(async (req, res) => {
    if (req.user.role === "HR") {
      throw new ApiError(Types.Errors.Forbidden, "HR cannot submit assessments");
    }

    const parsedBody = Types.Progress.Submit.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Invalid data", parsedBody.error);
    }

    const { lessonId, chapterId, assessmentId, answers } = parsedBody.data;

    // Verify enrollment
    const enrolled = await TrainingModel.exists({
      students: new mongoose.Types.ObjectId(req.user.id),
      Lessons: new mongoose.Types.ObjectId(lessonId),
    });
    if (!enrolled) {
      throw new ApiError(Types.Errors.Forbidden, "You are not enrolled in this lesson");
    }

    // Verify chapter belongs to lesson
    const lesson = await LessonModel.findById(lessonId).select("chapters");
    if (!lesson) throw new ApiError(Types.Errors.NotFound, "Lesson not found");
    const chapterInLesson = lesson.chapters.some((c) => String(c.chapter) === chapterId);
    if (!chapterInLesson) {
      throw new ApiError(Types.Errors.BadRequest, "Chapter does not belong to this lesson");
    }

    // Verify assessment belongs to chapter
    const chapter = await ChapterModel.findById(chapterId);
    if (!chapter) throw new ApiError(Types.Errors.NotFound, "Chapter not found");
    const assessmentInChapter = chapter.assessments.some((a) => String(a.assessmentId) === assessmentId);
    if (!assessmentInChapter) {
      throw new ApiError(Types.Errors.BadRequest, "Assessment does not belong to this chapter");
    }

    const assessment = await AssesmentModel.findById(assessmentId);
    if (!assessment) throw new ApiError(Types.Errors.NotFound, "Assessment not found");

    // Grade the submission — MCQ auto-graded, TEXT queued for manual review
    let earned = 0;
    let totalMarks = 0;
    let hasTextQuestions = false;
    const answersMap = new Map(answers.map((a) => [a.questionId, a.answer]));

    for (const q of assessment.questions) {
      const qMarks = q.marks ?? 1;
      totalMarks += qMarks;

      if (q.type === "TEXT") {
        hasTextQuestions = true;
        continue; // TEXT marks awarded only after manual review
      }

      const submitted = answersMap.get(String(q._id));
      if (submitted && submitted === q.correctAnswer) earned += qMarks;
    }

    const percentage = totalMarks > 0 ? Math.round((earned / totalMarks) * 100) : 0;
    // Cannot pass if there are unreviewed TEXT questions (score is incomplete)
    const passed = !hasTextQuestions && percentage >= (assessment.passingScore ?? 70);
    const reviewStatus = hasTextQuestions ? "pending_review" : "reviewed";

    const totalChapters = lesson.chapters.length;
    const allChapterIds = lesson.chapters.map((c) => String(c.chapter));
    const now = new Date();

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      let progress = await UserProgressModel.findOne({
        user: new mongoose.Types.ObjectId(req.user.id),
        lesson: new mongoose.Types.ObjectId(lessonId),
      }).session(session);

      if (!progress) {
        [progress] = await UserProgressModel.create(
          [{ user: req.user.id, lesson: lessonId, status: "in_progress", completedChapters: [], chapterProgress: [] }],
          { session }
        );
      }

      // Find or create chapterProgress entry
      let cpEntry = progress.chapterProgress.find((cp) => String(cp.chapter) === chapterId);
      if (!cpEntry) {
        progress.chapterProgress.push({ chapter: chapterId, status: "in_progress", assessmentAttempts: [] });
        cpEntry = progress.chapterProgress[progress.chapterProgress.length - 1];
      }

      // Record attempt
      cpEntry.assessmentAttempts.push({
        attemptedAt: now,
        answers: answers.map((a) => ({ questionId: a.questionId, answer: a.answer })),
        score: earned,
        totalScore: totalMarks,
        percentage,
        passed,
        reviewStatus,
      });

      let chapterStatus = cpEntry.status;
      // Only complete chapter if fully auto-graded and passed; manual-review attempts resolve later
      if (passed && reviewStatus === "reviewed" && cpEntry.status !== "completed") {
        cpEntry.status = "completed";
        cpEntry.completedAt = now;
        chapterStatus = "completed";

        const alreadyDone = progress.completedChapters.some((id) => String(id) === chapterId);
        if (!alreadyDone) {
          progress.completedChapters.push(new mongoose.Types.ObjectId(chapterId));
        }
      }

      progress.status = "in_progress";
      if (
        progress.completedChapters.length >= totalChapters &&
        allChapterIds.every((id) => progress.completedChapters.some((c) => String(c) === id))
      ) {
        progress.status = "completed";
      }

      await progress.save({ session });
      await session.commitTransaction();
      session.endSession();

      const message = hasTextQuestions
        ? "Assessment submitted — text answers are pending HR review"
        : passed
        ? "Assessment passed!"
        : "Assessment submitted — keep trying!";

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            passed,
            percentage,
            score: earned,
            totalScore: totalMarks,
            chapterStatus,
            lessonStatus: progress.status,
            reviewStatus,
          },
          message
        )
      );
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  });

  /**
   * GET /progress/me
   * Employee: own progress.
   * - No lessonId → all enrolled lessons with summary
   * - ?lessonId=X → detailed chapter breakdown in that lesson
   */
  GetMyProgress = AsyncHandler(async (req, res) => {
    const { lessonId } = req.query;
    const userId = new mongoose.Types.ObjectId(req.user.id);

    if (lessonId) {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        throw new ApiError(Types.Errors.BadRequest, "Invalid lessonId");
      }
      const data = await this._getStudentLessonDetail(userId, new mongoose.Types.ObjectId(lessonId));
      return res.status(200).json(new ApiResponse(200, data, "Progress fetched successfully"));
    }

    const data = await this._getStudentAllLessons(userId);
    return res.status(200).json(new ApiResponse(200, data, "Progress fetched successfully"));
  });

  /**
   * GET /progress
   * HR analytics — behaviour driven by query params:
   *  ?lessonId          → all students in that lesson
   *  ?lessonId+studentId → single student in one lesson (chapter detail)
   *  ?studentId         → all lessons for that student
   */
  GetAnalytics = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can view analytics");
    }

    const { lessonId, studentId } = req.query;

    if (lessonId && studentId) {
      if (!mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(studentId)) {
        throw new ApiError(Types.Errors.BadRequest, "Invalid lessonId or studentId");
      }
      const data = await this._getStudentLessonDetail(
        new mongoose.Types.ObjectId(studentId),
        new mongoose.Types.ObjectId(lessonId)
      );
      return res.status(200).json(new ApiResponse(200, data, "Analytics fetched successfully"));
    }

    if (lessonId) {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        throw new ApiError(Types.Errors.BadRequest, "Invalid lessonId");
      }
      const data = await this._getLessonStudentsOverview(new mongoose.Types.ObjectId(lessonId));
      return res.status(200).json(new ApiResponse(200, data, "Analytics fetched successfully"));
    }

    if (studentId) {
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        throw new ApiError(Types.Errors.BadRequest, "Invalid studentId");
      }
      const data = await this._getStudentAllLessons(new mongoose.Types.ObjectId(studentId));
      return res.status(200).json(new ApiResponse(200, data, "Analytics fetched successfully"));
    }

    throw new ApiError(Types.Errors.BadRequest, "Provide at least one of: lessonId, studentId");
  });

  /**
   * PATCH /progress/review
   * HR manually reviews TEXT answers in the latest pending attempt for a chapter.
   * Body: { userId, lessonId, chapterId, textScores: [{ questionId, score }], note? }
   */
  ReviewTextAnswers = AsyncHandler(async (req, res) => {
    const parsedBody = Types.Progress.Review.safeParse(req.body);
    if (!parsedBody.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Invalid data", parsedBody.error);
    }

    const { userId, lessonId, chapterId, textScores, note } = parsedBody.data;

    // Load lesson to know passing score and chapter list
    const lesson = await LessonModel.findById(lessonId).select("chapters");
    if (!lesson) throw new ApiError(Types.Errors.NotFound, "Lesson not found");

    // Load assessment to get totalMarks and passingScore
    const chapter = await ChapterModel.findById(chapterId);
    if (!chapter) throw new ApiError(Types.Errors.NotFound, "Chapter not found");

    const assessment = await AssesmentModel.findById(chapter.assessments?.[0]?.assessmentId);
    if (!assessment) throw new ApiError(Types.Errors.NotFound, "Assessment not found");

    // Authorization: HR can always review; employees must be the designated reviewer
    const isHR = req.user.role === "HR";
    const isReviewer = String(assessment.reviewer) === String(req.user.id);
    if (!isHR && !isReviewer) {
      throw new ApiError(Types.Errors.Forbidden, "Only HR or the designated reviewer can review this assessment");
    }

    const passingScore = assessment.passingScore ?? 70;
    const totalMarks = assessment.questions.reduce((sum, q) => sum + (q.marks ?? 1), 0);

    // Build a map of TEXT question marks for validation
    const textQuestionMarks = new Map(
      assessment.questions
        .filter((q) => q.type === "TEXT")
        .map((q) => [String(q._id), q.marks ?? 1])
    );

    // Validate that all provided questionIds are TEXT questions
    for (const ts of textScores) {
      if (!textQuestionMarks.has(ts.questionId)) {
        throw new ApiError(Types.Errors.BadRequest, `Question ${ts.questionId} is not a TEXT question in this assessment`);
      }
      const maxMarks = textQuestionMarks.get(ts.questionId);
      if (ts.score > maxMarks) {
        throw new ApiError(Types.Errors.BadRequest, `Score ${ts.score} exceeds max marks ${maxMarks} for question ${ts.questionId}`);
      }
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const progress = await UserProgressModel.findOne({
        user: new mongoose.Types.ObjectId(userId),
        lesson: new mongoose.Types.ObjectId(lessonId),
      }).session(session);

      if (!progress) throw new ApiError(Types.Errors.NotFound, "Progress record not found");

      const cpEntry = progress.chapterProgress.find((cp) => String(cp.chapter) === chapterId);
      if (!cpEntry || !cpEntry.assessmentAttempts.length) {
        throw new ApiError(Types.Errors.NotFound, "No attempts found for this chapter");
      }

      // Review the most recent attempt that is pending
      const attempt = [...cpEntry.assessmentAttempts].reverse().find((a) => a.reviewStatus === "pending_review");
      if (!attempt) {
        throw new ApiError(Types.Errors.BadRequest, "No pending-review attempt found for this chapter");
      }

      // Add TEXT scores on top of the MCQ score already stored
      const textEarned = textScores.reduce((sum, ts) => sum + ts.score, 0);

      attempt.score = (attempt.score ?? 0) + textEarned;
      attempt.percentage = totalMarks > 0 ? Math.round((attempt.score / totalMarks) * 100) : 0;
      attempt.passed = attempt.percentage >= passingScore;
      attempt.reviewStatus = "reviewed";
      attempt.reviewedAt = new Date();
      attempt.reviewedBy = new mongoose.Types.ObjectId(req.user.id);
      if (note) attempt.reviewerNote = note;

      progress.markModified("chapterProgress");

      // Update chapter status now that review is complete
      const now = new Date();
      if (attempt.passed && cpEntry.status !== "completed") {
        cpEntry.status = "completed";
        cpEntry.completedAt = now;

        const alreadyDone = progress.completedChapters.some((id) => String(id) === chapterId);
        if (!alreadyDone) {
          progress.completedChapters.push(new mongoose.Types.ObjectId(chapterId));
        }
      }

      // Re-evaluate lesson completion
      const totalChapters = lesson.chapters.length;
      const allChapterIds = lesson.chapters.map((c) => String(c.chapter));
      if (
        progress.completedChapters.length >= totalChapters &&
        allChapterIds.every((id) => progress.completedChapters.some((c) => String(c) === id))
      ) {
        progress.status = "completed";
      }

      await progress.save({ session });
      await session.commitTransaction();
      session.endSession();

      return res.status(200).json(
        new ApiResponse(
          200,
          {
            passed: attempt.passed,
            percentage: attempt.percentage,
            score: attempt.score,
            totalScore: totalMarks,
            chapterStatus: cpEntry.status,
            lessonStatus: progress.status,
          },
          "Review submitted successfully"
        )
      );
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  });

  /**
   * GET /progress/pending-reviews
   * HR: list all student-chapter pairs that have a pending-review attempt.
   * Optional ?lessonId=X to scope to one lesson.
   */
  GetPendingReviews = AsyncHandler(async (req, res) => {
    const isHR = req.user.role === "HR";
    const { lessonId } = req.query;

    const matchStage = {};
    if (lessonId) {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        throw new ApiError(Types.Errors.BadRequest, "Invalid lessonId");
      }
      matchStage.lesson = new mongoose.Types.ObjectId(lessonId);
    }

    const pipeline = [
      { $match: matchStage },
      // Only keep progress docs that have at least one pending attempt
      {
        $match: {
          "chapterProgress.assessmentAttempts.reviewStatus": "pending_review",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDoc",
        },
      },
      { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "lessons",
          localField: "lesson",
          foreignField: "_id",
          as: "lessonDoc",
        },
      },
      { $unwind: { path: "$lessonDoc", preserveNullAndEmptyArrays: true } },
      { $unwind: "$chapterProgress" },
      // Only chapter entries that have a pending attempt
      {
        $match: {
          "chapterProgress.assessmentAttempts.reviewStatus": "pending_review",
        },
      },
      {
        $lookup: {
          from: "chapters",
          localField: "chapterProgress.chapter",
          foreignField: "_id",
          as: "chapterDoc",
        },
      },
      { $unwind: { path: "$chapterDoc", preserveNullAndEmptyArrays: true } },
      // Join assessment to get reviewer field
      {
        $lookup: {
          from: "assessments",
          let: { aId: { $arrayElemAt: ["$chapterDoc.assessments.assessmentId", 0] } },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$aId"] } } },
            { $project: { reviewer: 1 } },
          ],
          as: "assessmentDoc",
        },
      },
      { $unwind: { path: "$assessmentDoc", preserveNullAndEmptyArrays: true } },
    ];

    // Employees only see pending reviews for assessments they are the reviewer of
    if (!isHR) {
      pipeline.push({
        $match: {
          "assessmentDoc.reviewer": new mongoose.Types.ObjectId(req.user.id),
        },
      });
    }

    pipeline.push(
      {
        $addFields: {
          pendingAttempt: {
            $arrayElemAt: [
              {
                $filter: {
                  input: "$chapterProgress.assessmentAttempts",
                  as: "a",
                  cond: { $eq: ["$$a.reviewStatus", "pending_review"] },
                },
              },
              -1, // latest pending attempt
            ],
          },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$userDoc._id",
          firstName: "$userDoc.firstName",
          lastName: "$userDoc.lastName",
          email: "$userDoc.email",
          lessonId: "$lessonDoc._id",
          lessonName: "$lessonDoc.name",
          chapterId: "$chapterProgress.chapter",
          chapterName: "$chapterDoc.name",
          assessmentId: { $arrayElemAt: ["$chapterDoc.assessments.assessmentId", 0] },
          attemptedAt: "$pendingAttempt.attemptedAt",
          answers: "$pendingAttempt.answers",
          mcqScore: "$pendingAttempt.score",
          totalScore: "$pendingAttempt.totalScore",
        },
      },
      { $sort: { attemptedAt: 1 } }
    );

    const rows = await UserProgressModel.aggregate(pipeline);
    return res.status(200).json(new ApiResponse(200, rows, "Pending reviews fetched successfully"));
  });

  /**
   * GET /progress/my-assessments
   * Employee: flat list of all chapters-with-assessments across enrolled lessons.
   * Optional ?filter=all|reviewed|pending_review|not_attempted
   */
  GetMyAssessments = AsyncHandler(async (req, res) => {
    if (req.user.role === "HR") {
      return res.status(200).json(new ApiResponse(200, [], "No assessments for HR"));
    }

    const { filter } = req.query;
    const userId = req.user.id;

    // 1. Find enrolled lessons
    const trainings = await TrainingModel.find({
      students: new mongoose.Types.ObjectId(userId),
    })
      .select("Lessons")
      .lean();

    const lessonIds = [
      ...new Set(trainings.flatMap((t) => t.Lessons.map((l) => String(l)))),
    ];

    if (!lessonIds.length) {
      return res.status(200).json(new ApiResponse(200, [], "No enrolled lessons"));
    }

    // 2. Get lessons with chapters
    const lessons = await LessonModel.find({
      _id: { $in: lessonIds.map((id) => new mongoose.Types.ObjectId(id)) },
    })
      .select("name chapters")
      .lean();

    // 3. Collect chapter references (lessonId, chapterId, rank)
    const chapterRefs = lessons.flatMap((l) =>
      l.chapters.map((c) => ({
        lessonId: String(l._id),
        lessonName: l.name,
        chapterId: String(c.chapter),
        rank: c.rank,
      }))
    );

    const chapterObjectIds = chapterRefs.map(
      (c) => new mongoose.Types.ObjectId(c.chapterId)
    );

    // 4. Get only chapters that have at least one assessment
    const chaptersWithAssessments = await ChapterModel.find({
      _id: { $in: chapterObjectIds },
      "assessments.0": { $exists: true },
    })
      .select("name assessments")
      .lean();

    const assessmentChapterMap = new Map(
      chaptersWithAssessments.map((c) => [String(c._id), c])
    );

    // 5. Get user progress for all lessons
    const progressDocs = await UserProgressModel.find({
      user: new mongoose.Types.ObjectId(userId),
      lesson: { $in: lessonIds.map((id) => new mongoose.Types.ObjectId(id)) },
    }).lean();

    const progressMap = new Map(progressDocs.map((p) => [String(p.lesson), p]));

    // 6. Build flat rows
    const rows = [];
    for (const ref of chapterRefs) {
      const chapterDoc = assessmentChapterMap.get(ref.chapterId);
      if (!chapterDoc) continue;

      const progress = progressMap.get(ref.lessonId);
      const cpEntry = progress?.chapterProgress?.find(
        (cp) => String(cp.chapter) === ref.chapterId
      );
      const attempts = cpEntry?.assessmentAttempts ?? [];

      let status;
      if (attempts.length === 0) {
        status = "not_attempted";
      } else {
        const latest = attempts[attempts.length - 1];
        status = latest.reviewStatus === "pending_review" ? "pending_review" : "reviewed";
      }

      rows.push({
        lessonId: ref.lessonId,
        lessonName: ref.lessonName,
        chapterId: ref.chapterId,
        chapterName: chapterDoc.name,
        rank: ref.rank,
        status,
        attemptsCount: attempts.length,
        latestAttempt: attempts.length
          ? {
              attemptedAt: attempts[attempts.length - 1].attemptedAt,
              percentage: attempts[attempts.length - 1].percentage,
              passed: attempts[attempts.length - 1].passed,
              reviewStatus: attempts[attempts.length - 1].reviewStatus,
              score: attempts[attempts.length - 1].score,
              totalScore: attempts[attempts.length - 1].totalScore,
            }
          : null,
      });
    }

    // 7. Apply filter
    let result = rows;
    if (filter === "reviewed") result = rows.filter((r) => r.status === "reviewed");
    else if (filter === "pending_review") result = rows.filter((r) => r.status === "pending_review");
    else if (filter === "not_attempted") result = rows.filter((r) => r.status === "not_attempted");

    return res.status(200).json(
      new ApiResponse(200, result, "Assessments fetched successfully")
    );
  });

  /**
   * GET /progress/overview
   * HR: high-level stats across all lessons.
   * Returns summary totals + per-lesson breakdown.
   */
  GetOverview = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can view analytics");
    }

    const lessonStats = await UserProgressModel.aggregate([
      {
        $lookup: {
          from: "lessons",
          localField: "lesson",
          foreignField: "_id",
          as: "lessonDoc",
        },
      },
      { $unwind: { path: "$lessonDoc", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          totalChapters: { $size: { $ifNull: ["$lessonDoc.chapters", []] } },
          completionPct: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$lessonDoc.chapters", []] } }, 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $size: { $ifNull: ["$completedChapters", []] } },
                      { $size: { $ifNull: ["$lessonDoc.chapters", []] } },
                    ],
                  },
                  100,
                ],
              },
              0,
            ],
          },
          hasPendingReview: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$chapterProgress", []] },
                    as: "cp",
                    cond: {
                      $gt: [
                        {
                          $size: {
                            $filter: {
                              input: { $ifNull: ["$$cp.assessmentAttempts", []] },
                              as: "a",
                              cond: { $eq: ["$$a.reviewStatus", "pending_review"] },
                            },
                          },
                        },
                        0,
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            lessonId: "$lesson",
            lessonName: "$lessonDoc.name",
            totalChapters: "$totalChapters",
          },
          enrolledCount: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          inProgressCount: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          notStartedCount: { $sum: { $cond: [{ $eq: ["$status", "not_started"] }, 1, 0] } },
          avgCompletionPct: { $avg: "$completionPct" },
          pendingReviewsCount: { $sum: { $cond: ["$hasPendingReview", 1, 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          lessonId: "$_id.lessonId",
          lessonName: "$_id.lessonName",
          totalChapters: "$_id.totalChapters",
          enrolledCount: 1,
          completedCount: 1,
          inProgressCount: 1,
          notStartedCount: 1,
          avgCompletionPct: { $round: ["$avgCompletionPct", 1] },
          pendingReviewsCount: 1,
        },
      },
      { $sort: { enrolledCount: -1 } },
    ]);

    const totalEnrollments = lessonStats.reduce((s, l) => s + l.enrolledCount, 0);
    const avgCompletionRate =
      lessonStats.length
        ? Math.round(lessonStats.reduce((s, l) => s + (l.avgCompletionPct || 0), 0) / lessonStats.length)
        : 0;
    const totalPendingReviews = lessonStats.reduce((s, l) => s + l.pendingReviewsCount, 0);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          summary: {
            totalLessons: lessonStats.length,
            totalEnrollments,
            avgCompletionRate,
            totalPendingReviews,
          },
          lessons: lessonStats,
        },
        "Overview fetched successfully"
      )
    );
  });

  // ─── Private aggregate helpers ────────────────────────────────────────────

  /**
   * All students in a lesson — summary row per student.
   */
  _getLessonStudentsOverview = async (lessonId) => {
    const lesson = await LessonModel.findById(lessonId).select("chapters name description");
    if (!lesson) throw new ApiError(Types.Errors.NotFound, "Lesson not found");
    const totalChapters = lesson.chapters.length;

    const rows = await UserProgressModel.aggregate([
      { $match: { lesson: lessonId } },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          completedCount: { $size: { $ifNull: ["$completedChapters", []] } },
          completionPct: {
            $cond: [
              { $gt: [totalChapters, 0] },
              { $multiply: [{ $divide: [{ $size: { $ifNull: ["$completedChapters", []] } }, totalChapters] }, 100] },
              0,
            ],
          },
          // Average of best (latest) attempt percentage per chapter
          avgAssessmentScore: {
            $avg: {
              $map: {
                input: {
                  $filter: {
                    input: { $ifNull: ["$chapterProgress", []] },
                    as: "cp",
                    cond: { $gt: [{ $size: { $ifNull: ["$$cp.assessmentAttempts", []] } }, 0] },
                  },
                },
                as: "cp",
                in: {
                  $arrayElemAt: [
                    "$$cp.assessmentAttempts.percentage",
                    { $subtract: [{ $size: "$$cp.assessmentAttempts" }, 1] },
                  ],
                },
              },
            },
          },
          // Count chapters that have at least one pending-review attempt
          pendingReviews: {
            $size: {
              $filter: {
                input: { $ifNull: ["$chapterProgress", []] },
                as: "cp",
                cond: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: { $ifNull: ["$$cp.assessmentAttempts", []] },
                          as: "a",
                          cond: { $eq: ["$$a.reviewStatus", "pending_review"] },
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          userId: "$user._id",
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          email: "$user.email",
          status: 1,
          completedCount: 1,
          completionPct: { $round: ["$completionPct", 1] },
          avgAssessmentScore: { $round: [{ $ifNull: ["$avgAssessmentScore", 0] }, 1] },
          pendingReviews: 1,
          updatedAt: 1,
        },
      },
      { $sort: { completionPct: -1 } },
    ]);

    return {
      lesson: { _id: lesson._id, name: lesson.name, description: lesson.description, totalChapters },
      students: rows,
    };
  };

  /**
   * Single student × one lesson — chapter-level breakdown with full attempt history.
   */
  _getStudentLessonDetail = async (userId, lessonId) => {
    const lesson = await LessonModel.findById(lessonId).select("chapters name description");
    if (!lesson) throw new ApiError(Types.Errors.NotFound, "Lesson not found");
    const totalChapters = lesson.chapters.length;

    const progress = await UserProgressModel.findOne({ user: userId, lesson: lessonId });

    // Build chapter-level details using chapter IDs in rank order
    const rankedChapterIds = lesson.chapters
      .sort((a, b) => a.rank - b.rank)
      .map((c) => c.chapter);

    const chapterDocs = await ChapterModel.find({ _id: { $in: rankedChapterIds } })
      .select("name description assessments videoLecture")
      .lean();

    const chapterMap = new Map(chapterDocs.map((c) => [String(c._id), c]));
    const cpMap = new Map(
      (progress?.chapterProgress || []).map((cp) => [String(cp.chapter), cp])
    );

    const chapters = rankedChapterIds.map((id, idx) => {
      const doc = chapterMap.get(String(id)) ?? {};
      const cp = cpMap.get(String(id));
      return {
        rank: lesson.chapters[idx]?.rank ?? idx + 1,
        chapterId: id,
        name: doc.name,
        description: doc.description,
        hasAssessments: (doc.assessments || []).length > 0,
        status: cp?.status ?? "not_started",
        openedAt: cp?.openedAt ?? null,
        completedAt: cp?.completedAt ?? null,
        attempts: (cp?.assessmentAttempts ?? []).map((a) => ({
          attemptedAt: a.attemptedAt,
          score: a.score,
          totalScore: a.totalScore,
          percentage: a.percentage,
          passed: a.passed,
          reviewStatus: a.reviewStatus,
          reviewedAt: a.reviewedAt ?? null,
          reviewerNote: a.reviewerNote ?? null,
        })),
        bestScore: cp?.assessmentAttempts?.length
          ? Math.max(...cp.assessmentAttempts.map((a) => a.percentage ?? 0))
          : null,
      };
    });

    const completedCount = progress?.completedChapters?.length ?? 0;
    return {
      lesson: { _id: lesson._id, name: lesson.name, totalChapters },
      overallStatus: progress?.status ?? "not_started",
      completedCount,
      completionPct: totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0,
      chapters,
    };
  };

  /**
   * Student × all enrolled lessons — summary per lesson.
   */
  _getStudentAllLessons = async (userId) => {
    const rows = await UserProgressModel.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: "lessons",
          localField: "lesson",
          foreignField: "_id",
          as: "lesson",
        },
      },
      { $unwind: { path: "$lesson", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          chaptersCount: { $size: { $ifNull: ["$lesson.chapters", []] } },
          completedCount: { $size: { $ifNull: ["$completedChapters", []] } },
        },
      },
      {
        $addFields: {
          completionPct: {
            $cond: [
              { $gt: ["$chaptersCount", 0] },
              { $multiply: [{ $divide: ["$completedCount", "$chaptersCount"] }, 100] },
              0,
            ],
          },
          bestScore: {
            $max: {
              $map: {
                input: { $ifNull: ["$chapterProgress", []] },
                as: "cp",
                in: {
                  $max: { $ifNull: ["$$cp.assessmentAttempts.percentage", [0]] },
                },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          lessonId: "$lesson._id",
          lessonName: "$lesson.name",
          lessonDescription: "$lesson.description",
          status: 1,
          chaptersCount: 1,
          completedCount: 1,
          completionPct: { $round: ["$completionPct", 1] },
          bestScore: { $round: [{ $ifNull: ["$bestScore", 0] }, 1] },
          updatedAt: 1,
        },
      },
      { $sort: { completionPct: -1 } },
    ]);

    return rows;
  };
}

export default UserProgressController;
