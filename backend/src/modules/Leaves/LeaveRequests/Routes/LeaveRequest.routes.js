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
        this.router.post("/", VerifyMiddleware, this.controller.Create);
        this.router.delete("/:uid", VerifyMiddleware, this.controller.Delete);
        this.router.get("/:uid", VerifyMiddleware, this.controller.Get);
        this.router.put("/:uid", VerifyMiddleware, this.controller.ResponseLeaveRequest);
        return this.router;
    }



}

export default LeaveRequestRoutes