import SkillController from "../Controllers/skill.controller.js";
import { Router } from "express";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
import { ReadCacheMiddleware, ClearCacheMiddleware } from "../../../middlewares/cache.middleware.js";

class SkillRoutes {
    constructor() {
        this.router = Router();
        this.skillController = new SkillController();
    }
    routes() {
        this.router.post("/", VerifyMiddleware, ClearCacheMiddleware("/api/v1/skills"), this.skillController.Create);
        this.router.put("/:id", VerifyMiddleware, ClearCacheMiddleware("/api/v1/skills"), this.skillController.Update);
        this.router.delete("/:id", VerifyMiddleware, ClearCacheMiddleware("/api/v1/skills"), this.skillController.Delete);

        this.router.get("/:id", VerifyMiddleware, ReadCacheMiddleware, this.skillController.Get);
        return this.router;
    }
}

export default SkillRoutes;