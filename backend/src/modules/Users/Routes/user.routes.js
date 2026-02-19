import { Router } from "express";
import UserController from "../Controllers/users.controllers.js";
import { ReadCacheMiddleware, ClearCacheMiddleware } from "../../../middlewares/cache.middleware.js";

class UserRoutes {
    constructor() {
        this.router = Router();
        this.userController = new UserController();
    }

    routes() {
        this.router.post("/create-employee", ClearCacheMiddleware("/api/v1/user/get-users"), this.userController.CreateEmployee);
        this.router.put("/update-employee/:id", ClearCacheMiddleware("/api/v1/user/get-users"), this.userController.UpdateEmployee);
        this.router.get("/get-users", ReadCacheMiddleware, this.userController.GetUsers);
        this.router.get("/get-users/:id", ReadCacheMiddleware, this.userController.GetUsers);
        this.router.delete("/delete-employee/:id", ClearCacheMiddleware("/api/v1/user/get-users"), this.userController.DeleteEmployee);
        return this.router;
    }
}

export default UserRoutes;