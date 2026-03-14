import { Router } from 'express';
import PermissionsController from '../Controllers/roles.controllers.js';
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";
class PermissionsRoutes {

  constructor() {
    this.router = Router();
    this.controller = new PermissionsController();
  }
  routes() {
    this.router.post("/", VerifyMiddleware, this.controller.Create);
    this.router.get("/", VerifyMiddleware, this.controller.Get);
    this.router.get("/:id", VerifyMiddleware, this.controller.Get);
    this.router.put("/:id", VerifyMiddleware, this.controller.Update);
    this.router.delete("/:id", VerifyMiddleware, this.controller.Delete);
    return this.router;
  }
}

export default PermissionsRoutes;
