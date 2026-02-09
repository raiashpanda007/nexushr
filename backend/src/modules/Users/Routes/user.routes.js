import { Router } from "express";
import UserController from "../Controllers/auth.controllers.js";

class UserRoutes {
    constructor() {
        this.router = Router();
        this.userController = new UserController();
    }

    routes() {
        this.router.post("/create-employee", this.userController.CreateEmployee);
        this.router.get("/get-users", this.userController.GetUsers);
        this.router.get("/get-users/:id", this.userController.GetUsers);
        return this.router;
    }
}

export default UserRoutes;