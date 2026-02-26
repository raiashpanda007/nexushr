import express from "express";
import cors from "cors";
import DB from "./config/Db.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import Routes from "./routes.js";
import RedisClient from "./config/Redis.js";

class App {
  constructor(DbUrl, DbName, RedisUrl) {
    this.app = express();
    this.#initializeSerivces(DbUrl, DbName, RedisUrl);
    this.#initializeMiddlewares();
    this.#initializeRoutes();
    this.#initializeErrorHandling();
    this.Db = null;
  }
  async #initializeSerivces(url, name, redisUrl) {
    this.Db = await new DB(url, name).Connect()
    this.redis = new RedisClient(redisUrl).GetClient();
  }

  #initializeRoutes() {
    this.app.use("/api/v1", new Routes().routes());
  }



  #initializeMiddlewares() {
    this.app.use(cors({
      origin: "http://localhost:5173",
      credentials: true
    }))
    this.app.use(express.json())
    this.app.use(cookieParser())
    this.app.use(express.urlencoded({ extended: false }))

  }

  Listen(PORT) {
    this.app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  }

  #initializeErrorHandling() {
    this.app.use(errorHandler)
  }
}

export default App;

