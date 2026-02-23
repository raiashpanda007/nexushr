import { Router } from "express";
import LeaveTypeController from "../Controllers/leaveTypes.controller.js";
import VerifyMiddleware from "../../../../middlewares/verify.middleware.js";

class LeaveTypeRouter {

    constructor() {
        this.router = Router()
        this.controller = new LeaveTypeController()
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



export default LeaveTypeRouter
