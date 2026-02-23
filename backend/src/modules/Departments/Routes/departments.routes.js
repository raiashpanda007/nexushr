import { Router } from "express";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";

import DepartmentController from "../Controllers/departments.controller.js";

class DepartmentRoutes {
    constructor() {
        this.router = Router();
        this.controller = new DepartmentController();
    }

    routes() {
        this.router.post("/", VerifyMiddleware, this.controller.Create);
        this.router.put("/:id", VerifyMiddleware, this.controller.Update);
        this.router.delete("/:id", VerifyMiddleware, this.controller.Delete);
        this.router.get("/", VerifyMiddleware, this.controller.Get);
        this.router.get("/:id", VerifyMiddleware, this.controller.Get);
        return this.router;
    }
}

export default DepartmentRoutes;