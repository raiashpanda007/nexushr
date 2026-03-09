import { Router } from "express";
import SkillRoutes from "./modules/Skills/Routes/skill.routes.js";
import UserRoutesIndex from "./modules/Users/Routes/index.js";
import DepartmentRoutes from "./modules/Departments/Routes/departments.routes.js";
import LeavesRouter from "./modules/Leaves/Leave.Routes.js";
import SalariesRoutes from "./modules/Salaries/Routes/Salaries.routes.js";
import PayrollRoutes from "./modules/Payroll/Routes/payroll.routes.js";
import AttendanceRoutes from "./modules/Attendance/Routes/Attendance.routes.js";
import SyncRoutes from "./modules/Sync/Routes/sync.routes.js";
import SearchRoutes from "./modules/Search/Routes/search.routes.js";
import EventRoutes from "./modules/Events/Routes/events.routes.js";
import AssetsRoutes from "./modules/Assets/Routes/assets.routes.js";
import HiringRoutes from "./modules/Hiring/Routers/hiring.routes.js";

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
        this.syncRoutes = new SyncRoutes().routes();
        this.searchRoutes = new SearchRoutes().routes();
        this.eventRoutes = new EventRoutes().routes();
        this.assetsRoutes = new AssetsRoutes().routes();
        this.hiringRoutes = new HiringRoutes().routes();
    }
    routes() {
        this.router.use("/", this.userRoutes);
        this.router.use("/skills", this.skillRoutes);
        this.router.use("/departments", this.departmentRoutes);
        this.router.use("/leaves", this.leavesRoutes);
        this.router.use("/salaries", this.salariesRoutes);
        this.router.use("/payroll", this.payrollRoutes);
        this.router.use("/attendance", this.attendanceRoutes);
        this.router.use("/sync", this.syncRoutes);
        this.router.use("/events", this.eventRoutes);
        this.router.use("/search", this.searchRoutes);
        this.router.use("/assets", this.assetsRoutes);
        this.router.use("/hiring", this.hiringRoutes);
        return this.router;
    }
}

export default Routes;