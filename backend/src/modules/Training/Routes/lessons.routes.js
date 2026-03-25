import { Router } from "express";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
import LessonController from "../Controllers/lessons.controller.js";

class LessonRoutes {
  constructor() {
    this.router = Router();
    this.controller = new LessonController();
  }

  routes() {
    this.router.post("/signed-url", VerifyMiddleware, this.controller.GetSignedURL);
    this.router.post("/", VerifyMiddleware, this.controller.Create);
    this.router.get("/", VerifyMiddleware, this.controller.Get);
    this.router.get("/:uid", VerifyMiddleware, this.controller.Get);
    this.router.put("/:uid", VerifyMiddleware, this.controller.Update);
    this.router.delete("/:uid", VerifyMiddleware, this.controller.Delete);
    return this.router;
  }
}

export default LessonRoutes;
