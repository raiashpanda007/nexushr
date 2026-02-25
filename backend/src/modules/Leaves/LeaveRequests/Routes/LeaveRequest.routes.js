import { Router } from "express";
import VerifyMiddleware from "../../../../middlewares/verify.middleware.js";
import LeaveRequestController from "../Controllers/LeaveRequest.controllers.js";

class LeaveRequestRoutes {
    constructor() {
        this.router = Router();
        this.controller = new LeaveRequestController();
    }

    routes() {
        this.router.get("/", VerifyMiddleware, this.controller.Get);
        this.router.get("/count", VerifyMiddleware, this.controller.Count);
        this.router.get("/department", VerifyMiddleware, this.controller.DepartmentStats);
        this.router.get("/department/:departmentId", VerifyMiddleware, this.controller.DepartmentStats);
        this.router.post("/", VerifyMiddleware, this.controller.Create);
        this.router.delete("/:uid", VerifyMiddleware, this.controller.Delete);
        this.router.put("/:uid", VerifyMiddleware, this.controller.ResponseLeaveRequest);
        this.router.get("/:uid", VerifyMiddleware, this.controller.Get);
        return this.router;
    }



}

export default LeaveRequestRoutes