import { Router } from "express";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
import AttendanceController from "../Controllers/Attendance.controllers.js";

class AttendanceRoutes {
    constructor() {
        this.router = Router();
        this.controller = new AttendanceController();
    }

    routes() {
        this.router.post("/", VerifyMiddleware, this.controller.Create);
        this.router.get("/", VerifyMiddleware, this.controller.Get);
        this.router.get("/punch-photo-url", VerifyMiddleware, this.controller.GetPunchPhotoSignedUrl);
        return this.router;
    }
}

export default AttendanceRoutes;