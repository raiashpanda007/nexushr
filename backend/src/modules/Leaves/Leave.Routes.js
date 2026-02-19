import { Router } from "express";
import LeaveTypeRouter from "./LeaveTypes/Routes/leaveTypes.routes.js";
import LeaveBalanceRouter from "./LeavesBalances/Routes/leaveBalance.routes.js";
import LeaveRequestRouter from "./LeaveRequests/Routes/LeaveRequest.routes.js";

class LeavesRouter {
    constructor() {
        this.router = Router()
    }

    routes() {
        this.router.use("/types", new LeaveTypeRouter().routes())
        this.router.use("/balances", new LeaveBalanceRouter().routes())
        this.router.use("/requests", new LeaveRequestRouter().routes())
        return this.router
    }
}

export default LeavesRouter