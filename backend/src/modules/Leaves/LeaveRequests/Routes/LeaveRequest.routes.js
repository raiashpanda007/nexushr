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
        this.router.delete("/:id", VerifyMiddleware, this.controller.Delete);
        this.router.get("/:id", VerifyMiddleware, this.controller.Get);
        this.router.put("/:id", VerifyMiddleware, this.controller.ResponseLeaveRequest);
        return this.router;
    }



}

export default LeaveRequestRoutes