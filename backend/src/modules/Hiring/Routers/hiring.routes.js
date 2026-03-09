import { Router } from "express";
import OpeningRoutes from "./opening.routes.js";

class HiringRoutes {
    
    constructor() {
        this.router = Router();
        this.openingRoutes = new OpeningRoutes();
    }

    routes () {
        this.router.use("/openings", this.openingRoutes.routes());
        return this.router;
    }
}

export default HiringRoutes;