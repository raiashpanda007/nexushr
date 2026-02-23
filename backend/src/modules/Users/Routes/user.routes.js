import { Router } from "express";
import UserController from "../Controllers/users.controllers.js";

class UserRoutes {
    constructor() {
        this.router = Router();
        this.userController = new UserController();
    }

    routes() {
        this.router.post("/create-employee", this.userController.CreateEmployee);
        this.router.put("/update-employee/:id", this.userController.UpdateEmployee);
        this.router.get("/get-users", this.userController.GetUsers);
        this.router.get("/get-users/:id", this.userController.GetUsers);
        this.router.delete("/delete-employee/:id", this.userController.DeleteEmployee);
        return this.router;
    }
}

export default UserRoutes;