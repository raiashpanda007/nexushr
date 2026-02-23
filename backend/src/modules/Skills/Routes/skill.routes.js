import SkillController from "../Controllers/skill.controller.js";
import { Router } from "express";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";

class SkillRoutes {
    constructor() {
        this.router = Router();
        this.skillController = new SkillController();
    }
    routes() {
        this.router.post("/", VerifyMiddleware, this.skillController.Create);
        this.router.put("/:id", VerifyMiddleware, this.skillController.Update);
        this.router.delete("/:id", VerifyMiddleware, this.skillController.Delete);

        this.router.get("/", VerifyMiddleware, this.skillController.Get);
        this.router.get("/:id", VerifyMiddleware, this.skillController.Get);
        return this.router;
    }
}

export default SkillRoutes;