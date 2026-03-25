import mongoose from "mongoose";
import TrainingModel from "../Models/training.model.js";
import LessonModel from "../Models/lessons.model.js";
import UserModel from "../../Users/models/users.models.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";

class TrainingController {
  /**
   * GET /training/programs/lesson/:lessonId/students
   * Returns all students enrolled across every Training that includes this lesson.
   */
  GetStudents = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can view enrolled students");
    }

    const { lessonId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      throw new ApiError(Types.Errors.BadRequest, "Invalid lesson ID");
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const trainings = await TrainingModel.find({
      Lessons: new mongoose.Types.ObjectId(lessonId),
    }).populate("students", "-passwordHash");

    // Deduplicate across multiple trainings
    const seen = new Set();
    const students = [];
    for (const t of trainings) {
      for (const s of t.students) {
        const id = s._id.toString();
        if (!seen.has(id)) {
          seen.add(id);
          students.push(s);
        }
      }
    }

    const total = students.length;
    const data = students.slice(skip, skip + limit);

    return res
      .status(200)
      .json(new ApiResponse(200, { data, total, page, limit }, "Enrolled students fetched"));
  });

  /**
   * POST /training/programs/lesson/:lessonId/students
   * Body: { studentIds: string[] }
   * Adds students to the Training for this lesson (creates Training if none exists).
   */
  AddStudents = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can enroll students");
    }

    const { lessonId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      throw new ApiError(Types.Errors.BadRequest, "Invalid lesson ID");
    }

    const parsed = Types.TrainingProgram.AddStudents.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(Types.Errors.UnprocessableData, "Invalid data", parsed.error);
    }
    const { studentIds } = parsed.data;

    // Verify all IDs belong to actual EMPLOYEE users
    const employees = await UserModel.find({
      _id: { $in: studentIds },
      role: "EMPLOYEE",
    }).select("_id");

    if (employees.length !== studentIds.length) {
      throw new ApiError(
        Types.Errors.BadRequest,
        "One or more IDs are not valid employees"
      );
    }

    // Find or create a Training for this lesson
    let training = await TrainingModel.findOne({
      Lessons: new mongoose.Types.ObjectId(lessonId),
    });

    if (!training) {
      const lesson = await LessonModel.findById(lessonId);
      if (!lesson) {
        throw new ApiError(Types.Errors.NotFound, "Lesson not found");
      }
      training = new TrainingModel({
        name: lesson.name,
        description: lesson.description,
        Lessons: [lessonId],
        students: [],
      });
    }

    // Add only new students (skip duplicates)
    const existingSet = new Set(training.students.map((s) => s.toString()));
    const newIds = studentIds.filter((id) => !existingSet.has(id));

    if (newIds.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, { added: 0 }, "All selected students are already enrolled"));
    }

    training.students.push(...newIds.map((id) => new mongoose.Types.ObjectId(id)));
    await training.save();

    return res
      .status(200)
      .json(new ApiResponse(200, { added: newIds.length }, `${newIds.length} student(s) enrolled`));
  });

  /**
   * GET /training/programs/lesson/:lessonId/students/preview-by-skill
   * Query: skillId, maxLevel (1-5)
   * Returns employees who have the given skill at level <= maxLevel and are not yet enrolled.
   */
  PreviewBySkill = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can preview students");
    }

    const { lessonId } = req.params;
    const { skillId, maxLevel } = req.query;

    if (!skillId || !maxLevel) {
      throw new ApiError(Types.Errors.BadRequest, "skillId and maxLevel are required");
    }
    if (!mongoose.Types.ObjectId.isValid(skillId)) {
      throw new ApiError(Types.Errors.BadRequest, "Invalid skillId");
    }

    const level = parseInt(maxLevel, 10);
    if (isNaN(level) || level < 1 || level > 5) {
      throw new ApiError(Types.Errors.BadRequest, "maxLevel must be between 1 and 5");
    }

    // Get already-enrolled students for this lesson
    const trainings = await TrainingModel.find({
      Lessons: new mongoose.Types.ObjectId(lessonId),
    }).select("students");
    const enrolledIds = new Set(
      trainings.flatMap((t) => t.students.map((s) => s.toString()))
    );

    const employees = await UserModel.find({
      role: "EMPLOYEE",
      skills: {
        $elemMatch: {
          skillId: new mongoose.Types.ObjectId(skillId),
          amount: { $lte: level },
        },
      },
    }).select("_id firstName lastName email profilePhoto skills");

    // Annotate with enrollment status
    const result = employees.map((e) => ({
      ...e.toObject(),
      alreadyEnrolled: enrolledIds.has(e._id.toString()),
    }));

    return res
      .status(200)
      .json(new ApiResponse(200, result, "Matching employees fetched"));
  });

  /**
   * DELETE /training/programs/lesson/:lessonId/students/:studentId
   */
  RemoveStudent = AsyncHandler(async (req, res) => {
    if (req.user.role !== "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can remove students");
    }

    const { lessonId, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(lessonId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      throw new ApiError(Types.Errors.BadRequest, "Invalid ID");
    }

    await TrainingModel.updateMany(
      { Lessons: new mongoose.Types.ObjectId(lessonId) },
      { $pull: { students: new mongoose.Types.ObjectId(studentId) } }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Student removed from training"));
  });
}

export default TrainingController;
