import { Router } from "express";
import UserController from "../Controllers/auth.controllers.js";
import { ReadCacheMiddleware, ClearCacheMiddleware } from "../../../middlewares/cache.middleware.js";

class UserRoutes {
    constructor() {
        this.router = Router();
        this.userController = new UserController();
    }

    routes() {
        // Invalidate cache when creating a new employee
        this.router.post("/create-employee", ClearCacheMiddleware("/api/v1/user/get-users"), this.userController.CreateEmployee);

        // Use cache for fetching users
        this.router.get("/get-users", ReadCacheMiddleware, this.userController.GetUsers);
        this.router.get("/get-users/:id", ReadCacheMiddleware, this.userController.GetUsers);
        return this.router;
    }
}

export default UserRoutes;