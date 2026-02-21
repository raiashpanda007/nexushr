import { Router } from "express";
import SkillRoutes from "./modules/Skills/Routes/skill.routes.js";
import UserRoutesIndex from "./modules/Users/Routes/index.js";
import DepartmentRoutes from "./modules/Departments/Routes/departments.routes.js";
import LeavesRouter from "./modules/Leaves/Leave.Routes.js";
import SalariesRoutes from "./modules/Salaries/Routes/Salaries.routes.js";
import PayrollRoutes from "./modules/Payroll/Routes/payroll.routes.js";
import AttendanceRoutes from "./modules/Attendance/Routes/Attendance.routes.js";

class Routes {
    constructor() {
        this.router = Router();
        this.userRoutes = new UserRoutesIndex().routes();
        this.skillRoutes = new SkillRoutes().routes();
        this.departmentRoutes = new DepartmentRoutes().routes();
        this.leavesRoutes = new LeavesRouter().routes();
        this.salariesRoutes = new SalariesRoutes().routes();
        this.payrollRoutes = new PayrollRoutes().routes();
        this.attendanceRoutes = new AttendanceRoutes().routes();
    }
    routes() {
        this.router.use("/", this.userRoutes);
        this.router.use("/skills", this.skillRoutes);
        this.router.use("/departments", this.departmentRoutes);
        this.router.use("/leaves", this.leavesRoutes);
        this.router.use("/salaries", this.salariesRoutes);
        this.router.use("/payroll", this.payrollRoutes);
        this.router.use("/attendance", this.attendanceRoutes);
        return this.router;
    }
}

export default Routes;