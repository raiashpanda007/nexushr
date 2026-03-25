import { Router } from "express";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
import UserProgressController from "../Controllers/userProgress.controller.js";

class ProgressRoutes {
  constructor() {
    this.router = Router();
    this.controller = new UserProgressController();
  }

  routes() {
    this.router.post("/submit", VerifyMiddleware, this.controller.SubmitAssessment);
    this.router.patch("/review", VerifyMiddleware, this.controller.ReviewTextAnswers);
    this.router.get("/overview", VerifyMiddleware, this.controller.GetOverview);
    this.router.get("/my-assessments", VerifyMiddleware, this.controller.GetMyAssessments);
    this.router.get("/pending-reviews", VerifyMiddleware, this.controller.GetPendingReviews);
    this.router.get("/me", VerifyMiddleware, this.controller.GetMyProgress);
    this.router.get("/", VerifyMiddleware, this.controller.GetAnalytics);
    return this.router;
  }
}

export default ProgressRoutes;
