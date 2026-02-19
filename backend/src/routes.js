import { Router } from "express";
import SkillRoutes from "./modules/Skills/Routes/skill.routes.js";
import UserRoutesIndex from "./modules/Users/Routes/index.js";
import DepartmentRoutes from "./modules/Departments/Routes/departments.routes.js";
import LeavesRouter from "./modules/Leaves/Leave.Routes.js";

class Routes {
    constructor() {
        this.router = Router();
        this.userRoutes = new UserRoutesIndex().routes();
        this.skillRoutes = new SkillRoutes().routes();
        this.departmentRoutes = new DepartmentRoutes().routes();
        this.leavesRoutes = new LeavesRouter().routes();
    }
    routes() {
        this.router.use("/", this.userRoutes);
        this.router.use("/skills", this.skillRoutes);
        this.router.use("/departments", this.departmentRoutes);
        this.router.use("/leaves", this.leavesRoutes);
        return this.router;
    }
}

export default Routes;