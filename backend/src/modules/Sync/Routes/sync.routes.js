import { Router } from "express";
import SyncController from "../Controller/sync.controller.js";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";

class SyncRoutes {
    constructor() {
        this.router = Router();
        this.syncController = new SyncController();
    }

    routes() {
        this.router.post("/", VerifyMiddleware, this.syncController.Handler);
        return this.router;
    }
}

export default SyncRoutes;