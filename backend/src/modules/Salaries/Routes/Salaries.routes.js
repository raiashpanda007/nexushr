import { Router } from "express"
import VerifyMiddleware from "../../../middlewares/verify.middleware.js"

import SalariesController from "../Controllers/Salaries.controller.js"
class SalariesRoutes {
    constructor() {
        this.router = Router()
        this.controller = new SalariesController()
    }

    routes() {
        this.router.post("/", VerifyMiddleware, this.controller.Create)
        this.router.put("/:id", VerifyMiddleware, this.controller.Update)
        this.router.delete("/:id", VerifyMiddleware, this.controller.Delete)
        this.router.get("/:id", VerifyMiddleware, this.controller.Get)
        this.router.get("/", VerifyMiddleware, this.controller.Get)
        return this.router
    }
}

export default SalariesRoutes