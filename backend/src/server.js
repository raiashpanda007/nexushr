import express from "express";
import cors from "cors";
import DB from "./config/Db.js";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";
import Routes from "./routes.js";
import RedisClient from "./utils/redis.client.js";
class App {
  constructor(DbUrl, DbName) {
    this.app = express();
    this.#initializeSerivces(DbUrl, DbName);
    this.#initializeMiddlewares();
    this.#initializeRoutes();
    this.#initializeErrorHandling();
    this.Db = null;
    this.redisClient = null;
  }
  async #initializeSerivces(url, name) {
    this.Db = await new DB(url, name).Connect()
    this.redisClient = new RedisClient().getClient();
  }

  #initializeRoutes() {
    this.app.use("/api/v1", new Routes().routes());
  }



  #initializeMiddlewares() {
    this.app.use(cors())
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

