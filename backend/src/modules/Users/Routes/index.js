import { Router } from "express";
import UserRoutes from "./user.routes.js";
import AuthRoutes from "./auth.routes.js";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
class UserRoutesIndex {
    constructor() {
        this.router = Router();
        this.userRoutes = new UserRoutes();
        this.authRoutes = new AuthRoutes();
    }

    routes() {
        this.router.use("/user", VerifyMiddleware, this.userRoutes.routes());
        this.router.use("/auth", this.authRoutes.routes());
        return this.router;
    }
}

export default UserRoutesIndex;