import { Router } from "express";
import { ReadCacheMiddleware, ClearCacheMiddleware } from "../../../../middlewares/cache.middleware.js";
import LeaveTypeController from "../Controllers/leaveTypes.controller.js";
import VerifyMiddleware from "../../../../middlewares/verify.middleware.js";

class LeaveTypeRouter {

    constructor() {
        this.router = Router()
        this.controller = new LeaveTypeController()
    }

    routes() {
        this.router.post("/", VerifyMiddleware, ClearCacheMiddleware("/api/v1/leaves/types"), this.controller.Create);
        this.router.put("/:id", VerifyMiddleware, ClearCacheMiddleware("/api/v1/leaves/types"), this.controller.Update);
        this.router.delete("/:id", VerifyMiddleware, ClearCacheMiddleware("/api/v1/leaves/types"), this.controller.Delete);
        this.router.get("/", VerifyMiddleware, ReadCacheMiddleware, this.controller.Get);
        this.router.get("/:id", VerifyMiddleware, ReadCacheMiddleware, this.controller.Get);
        return this.router;
    }


}



export default LeaveTypeRouter
