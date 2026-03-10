import { Router } from "express";
import ApplicantController from "../Controllers/applicant.controller.js";
import VerifyMiddleware from "../../../middlewares/verify.middleware.js";

class ApplicantRoutes {
  constructor() {
    this.router = Router();
    this.controller = new ApplicantController();

  }

  routes() {
    this.router.post("/", this.controller.Create);
    this.router.delete("/:applicantId", this.controller.Delete);
    this.router.put("/:applicantId", this.controller.Update);
    this.router.post("/signed-url", this.controller.GetSignedURL);
    this.router.get("/", this.controller.Get);
    this.router.get("/:applicantId", VerifyMiddleware, this.controller.Get);

    return this.router;
  }
}


export default ApplicantRoutes;