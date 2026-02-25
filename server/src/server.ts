import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors";
import type { ConfigType, ServicesType } from "./types/config.types";
import RedisClient from "./services/Redis";
import DB from "./services/Db";

class App {
    private app: express.Application
    private services: ServicesType
    constructor(cfg: ConfigType) {
        this.app = express();
        this.services = this.initializeService(cfg);
        this.intializeMiddleware();
        this.intializeRoutes();
    }

    private initializeService(cfg: ConfigType):ServicesType {
        const redis = RedisClient.GetInstance(cfg).GetClient();
        const db = new DB(cfg.MONGO_DB_URL, cfg.DB_NAME).Connect();
        return {
            Redis: redis,
            Db: db as any
        };
    }

    private intializeMiddleware() {
    this.app.use(cors({
      origin: "http://localhost:5173",
      credentials: true
    }))
    this.app.use(express.json())
    this.app.use(cookieParser())
    this.app.use(express.urlencoded({ extended: false }))
    }

    private intializeRoutes() {

    }

    public Start(port: number) {
        this.app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    }

}
export default App;