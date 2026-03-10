import { Router } from "express";
import RoundController from "../Controllers/rounds.controller.js";
class RoundsRoutes {
    constructor( ) {
        this.router = Router();
        this.controller = new RoundController();
    }
    routes() {
        this.router.get("/", this.controller.Get);
        return this.router;
    }
}
export default RoundsRoutes;