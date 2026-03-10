import { Router } from "express";
import OpeningRoutes from "./opening.routes.js";
import ApplicantRoutes from "./applicant.routes.js";
import InterviewRoutes from "./interview.routes.js";
import RoundsRoutes from "./rounds.routes.js";

class HiringRoutes {
    
    constructor() {
        this.router = Router();
        this.openingRoutes = new OpeningRoutes();
        this.applicantRoutes = new ApplicantRoutes();
        this.interviewRoutes = new InterviewRoutes();
        this.roundsRoutes = new RoundsRoutes();
    }

    routes () {
        this.router.use("/openings", this.openingRoutes.routes());
        this.router.use("/applicants", this.applicantRoutes.routes());
        this.router.use("/interviews", this.interviewRoutes.routes());
        this.router.use("/rounds", this.roundsRoutes.routes());
        return this.router;
    }
}

export default HiringRoutes;