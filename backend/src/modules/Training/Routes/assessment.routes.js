import { Router } from "express";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
import AssessmentController from "../Controllers/assessment.controller.js";

class AssessmentRoutes {
  constructor() {
    this.router = Router();
    this.controller = new AssessmentController();
  }

  routes() {
    this.router.post("/", VerifyMiddleware, this.controller.Create);
    this.router.get("/", VerifyMiddleware, this.controller.Get);
    this.router.get("/:uid", VerifyMiddleware, this.controller.Get);
    this.router.put("/:uid", VerifyMiddleware, this.controller.Update);
    this.router.delete("/:uid", VerifyMiddleware, this.controller.Delete);
    return this.router;
  }
}

export default AssessmentRoutes;
