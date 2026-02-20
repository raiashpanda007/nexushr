import { Router } from "express";
import LeaveBalanceController from "../Controllers/leaveBalances.controllers.js";
import VerifyMiddleware from "../../../../middlewares/verify.middleware.js"
class LeaveBalanceRoutes {
    constructor() {
        this.router = Router();
        this.controller = new LeaveBalanceController();
    }

    routes() {
        this.router.post("/", VerifyMiddleware, this.controller.Create);
        this.router.delete("/:id", VerifyMiddleware, this.controller.Delete);
        this.router.get("/:id", VerifyMiddleware, this.controller.Get);
        this.router.get("/", VerifyMiddleware, this.controller.Get);
        this.router.put("/:id", VerifyMiddleware, this.controller.Update);
        return this.router;
    }



}

export default LeaveBalanceRoutes