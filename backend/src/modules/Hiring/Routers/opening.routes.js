import {Router} from "express";
import OpeningsController from "../Controllers/opening.controllers.js";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
class OpeningRoutes {

    constructor() {
        this.controller = new OpeningsController();
        this.router = Router();
    }

    routes () {
        this.router.get("/public/:id", this.controller.GetPublic);
        this.router.post("/", VerifyMiddleware, this.controller.Create);
        this.router.get("/", VerifyMiddleware, this.controller.Get);
        this.router.get("/:id", VerifyMiddleware, this.controller.Get);
        this.router.delete("/:id", VerifyMiddleware, this.controller.Delete);
        this.router.put("/:id", VerifyMiddleware, this.controller.Update);
        return this.router;
    }
}


export default OpeningRoutes;