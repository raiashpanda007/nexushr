import { Router } from "express";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
import TrainingController from "../Controllers/training.controller.js";

class TrainingProgramRoutes {
  constructor() {
    this.router = Router();
    this.controller = new TrainingController();
  }

  routes() {
    // Preview employees matching a skill level (before committing)
    this.router.get(
      "/lesson/:lessonId/students/preview-by-skill",
      VerifyMiddleware,
      this.controller.PreviewBySkill
    );

    // Get all enrolled students for a lesson
    this.router.get(
      "/lesson/:lessonId/students",
      VerifyMiddleware,
      this.controller.GetStudents
    );

    // Enroll students by explicit IDs
    this.router.post(
      "/lesson/:lessonId/students",
      VerifyMiddleware,
      this.controller.AddStudents
    );

    // Remove a student
    this.router.delete(
      "/lesson/:lessonId/students/:studentId",
      VerifyMiddleware,
      this.controller.RemoveStudent
    );

    return this.router;
  }
}

export default TrainingProgramRoutes;
