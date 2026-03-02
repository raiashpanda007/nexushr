import { Router } from "express";
import PayrollController from "../Controllers/Payroll.Controller.js";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
const router = Router();

class PayrollRoutes {
    constructor() {
        this.router = router;
        this.controller = new PayrollController();
    }

    routes() {
        this.router.post("/", VerifyMiddleware, this.controller.Create);
        this.router.post("/bulk", VerifyMiddleware, this.controller.GenerateBulkPayroll);
        this.router.get("/analytics", VerifyMiddleware, this.controller.GetAnalytics);
        this.router.get("/deduction/:id", VerifyMiddleware, this.controller.GetLeaveDeductions);
        this.router.get("/", VerifyMiddleware, this.controller.Get);
        this.router.get("/:id", VerifyMiddleware, this.controller.Get);
        return this.router;
    }
}


export default PayrollRoutes;