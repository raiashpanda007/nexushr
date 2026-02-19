import { Router } from "express";
import SkillRoutes from "./modules/Skills/Routes/skill.routes.js";
import UserRoutesIndex from "./modules/Users/Routes/index.js";

class Routes {
    constructor() {
        this.router = Router();
        this.userRoutes = new UserRoutesIndex().routes();
        this.skillRoutes = new SkillRoutes().routes();
    }
    routes() {
        this.router.use("/", this.userRoutes);
        this.router.use("/skills", this.skillRoutes);
        return this.router;
    }
}

export default Routes;