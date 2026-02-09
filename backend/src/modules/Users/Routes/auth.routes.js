import { Router } from "express";
import UserController from "../Controllers/auth.controllers.js";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";

class AuthRoutes {
    constructor() {
        this.router = Router();
        this.userController = new UserController();
    }

    routes() {

        this.router.post("/login", this.userController.Login);
        this.router.post("/logout", VerifyMiddleware, this.userController.LogOut);
        this.router.post("/refresh-access-token", this.userController.RefreshAccessToken);
        return this.router;
    }
}

export default AuthRoutes;