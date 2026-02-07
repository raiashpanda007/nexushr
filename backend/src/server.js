import express from "express";
import cors from "cors";
import DB from "./config/Db.js";

class App {
  constructor(DbUrl, DbName) {
    this.app = express();
    this.#initializeSerivces(DbUrl, DbName);
    this.#initializeMiddlewares();
    this.Db = null;
  }

  async #initializeSerivces(url, name) {
    this.Db = await new DB(url, name).Connect()
  }

  #initializeMiddlewares() {
    this.app.use(cors())
    this.app.use(express.json())
    this.app.use(express.urlencoded({ extended: false }))
  }

  Listen(PORT) {
    this.app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
    })
  }
}

export default App;

