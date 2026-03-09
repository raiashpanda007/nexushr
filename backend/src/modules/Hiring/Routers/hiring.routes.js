import { Router } from "express";
import OpeningRoutes from "./opening.routes.js";
import ApplicantRoutes from "./applicant.routes.js";

class HiringRoutes {
    
    constructor() {
        this.router = Router();
        this.openingRoutes = new OpeningRoutes();
        this.applicantRoutes = new ApplicantRoutes();
    }

    routes () {
        this.router.use("/openings", this.openingRoutes.routes());
        this.router.use("/applicants", this.applicantRoutes.routes());
        return this.router;
    }
}

export default HiringRoutes;