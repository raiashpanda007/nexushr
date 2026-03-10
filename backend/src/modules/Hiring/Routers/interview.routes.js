import {Router} from "express";
import InterviewController from "../Controllers/interview.controller.js";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
class InterviewRoutes {
  constructor() {
    this.router = Router();
    this.controller = new InterviewController();
  }
  routes() {
    this.router.post("/", VerifyMiddleware, this.controller.Create);
    this.router.patch("/:id", VerifyMiddleware, this.controller.Update);
    this.router.get("/my", VerifyMiddleware, this.controller.GetMyInterviews);
    this.router.get("/", this.controller.Get);
    this.router.get("/:id", this.controller.Get);
    return this.router;
  }
}

export default InterviewRoutes;