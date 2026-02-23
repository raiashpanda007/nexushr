import { Router } from "express";
import SearchController from "../Controller/search.controller.js";

class SearchRoutes {
    constructor() {
        this.router = Router()
        this.controller = new SearchController()
    }

    routes() {
        this.router.get("/:model", this.controller.Search)
        return this.router
    }
}

export default SearchRoutes