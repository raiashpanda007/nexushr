import { Router } from "express";
import LessonRoutes from "./lessons.routes.js";
import ChapterRoutes from "./chapter.routes.js";
import AssessmentRoutes from "./assessment.routes.js";
import ProgressRoutes from "./progress.routes.js";
import TrainingProgramRoutes from "./trainingProgram.routes.js";

class TrainingRoutes {
  constructor() {
    this.router = Router();
  }

  routes() {
    this.router.use("/lessons", new LessonRoutes().routes());
    this.router.use("/chapters", new ChapterRoutes().routes());
    this.router.use("/assessments", new AssessmentRoutes().routes());
    this.router.use("/progress", new ProgressRoutes().routes());
    this.router.use("/programs", new TrainingProgramRoutes().routes());
    return this.router;
  }
}

export default TrainingRoutes;
