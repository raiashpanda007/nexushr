import mongoose from "mongoose";
import { ObjectId } from "mongodb";

class DB {
  #dbUrl = "";
  #dbName = "";

  constructor(url, name) {
    this.#dbUrl = url;
    this.#dbName = name;
  }

  async Connect() {
    try {
      const connectionDB = await mongoose.connect(this.#dbUrl, {
        dbName: this.#dbName,
      });

      console.info("DB Connected :: ", connectionDB.connection.host);
    } catch (e) {
      console.error("Error in db/index :", e);
      process.exit(1);
    }
  }

  getDb() {
    return mongoose.connection.db;
  }

  async findUserById(id) {
    try {
      const db = this.getDb();

      if (!ObjectId.isValid(id)) {
        throw new Error("Invalid ObjectId");
      }

      const user = await db.collection("users").findOne({
        _id: new ObjectId(id),
      });

      return user;
    } catch (error) {
      console.error("Error finding user:", error);
      throw error;
    }
  }
}

export default DB;