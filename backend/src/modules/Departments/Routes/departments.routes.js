import { Router } from "express";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
import { ReadCacheMiddleware, ClearCacheMiddleware } from "../../../middlewares/cache.middleware.js";
import DepartmentController from "../Controllers/departments.controller.js";

class DepartmentRoutes {
    constructor() {
        this.router = Router();
        this.controller = new DepartmentController();
    }

    routes() {
        this.router.post("/", VerifyMiddleware, ClearCacheMiddleware("/api/v1/departments"), this.controller.Create);
        this.router.put("/:id", VerifyMiddleware, ClearCacheMiddleware("/api/v1/departments"), this.controller.Update);
        this.router.delete("/:id", VerifyMiddleware, ClearCacheMiddleware("/api/v1/departments"), this.controller.Delete);
        this.router.get("/", VerifyMiddleware, ReadCacheMiddleware, this.controller.Get);
        this.router.get("/:id", VerifyMiddleware, ReadCacheMiddleware, this.controller.Get);
        return this.router;
    }
}

export default DepartmentRoutes;