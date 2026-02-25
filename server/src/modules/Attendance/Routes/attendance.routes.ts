import { Router } from "express";
import AttendanceController from "../Controllers/attendance.controller";
import VerifyMiddleware from "../../../middlewares/Verify.Middleware";

class AttendanceRoutes {
  private readonly router: Router;
  private readonly controller: AttendanceController;

  constructor() {
    this.router = Router();
    this.controller = new AttendanceController();
  }

  public routes(): Router {
    this.router.post("/", VerifyMiddleware, this.controller.Create);
    this.router.get("/", VerifyMiddleware, this.controller.Get);
    return this.router;
  }
}

export default AttendanceRoutes;
