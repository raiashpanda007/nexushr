import { Router } from "express";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
import ChapterController from "../Controllers/chapter.controller.js";

class ChapterRoutes {
  constructor() {
    this.router = Router();
    this.controller = new ChapterController();
  }

  routes() {
    this.router.post("/", VerifyMiddleware, this.controller.Create);
    this.router.post("/:uid/open", VerifyMiddleware, this.controller.MarkOpened);
    this.router.get("/", VerifyMiddleware, this.controller.Get);
    this.router.get("/:uid", VerifyMiddleware, this.controller.Get);
    this.router.put("/:uid", VerifyMiddleware, this.controller.Update);
    this.router.delete("/:uid", VerifyMiddleware, this.controller.Delete);
    return this.router;
  }
}

export default ChapterRoutes;
