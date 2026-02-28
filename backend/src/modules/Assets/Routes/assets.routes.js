import { Router } from "express";
import AssetsController from "../Controller/asset.controller.js";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
class AssetsRoutes {
    constructor() {
        this.router = Router();
        this.controller = new AssetsController();
    }

    routes() {
        this.router.post("/", VerifyMiddleware, this.controller.Create);
        this.router.put("/:id", VerifyMiddleware, this.controller.Update);
        this.router.get("/", VerifyMiddleware, this.controller.Get);
        this.router.get("/upload-url", VerifyMiddleware, this.controller.GetSignedUrl);
        this.router.get("/stats", VerifyMiddleware, this.controller.GetStats);
        this.router.delete("/:id", VerifyMiddleware, this.controller.Delete);
        this.router.get("/:id", VerifyMiddleware, this.controller.Get);
        return this.router;
    }
}

export default AssetsRoutes;