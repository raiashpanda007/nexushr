import { Router } from "express";
import ApplicantController from "../Controllers/applicant.controller.js";


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
    return this.router;
  }
}


export default ApplicantRoutes;