import { MongoClient } from "mongodb";

class DB {
  #client;
  #db;

  constructor(url, dbName) {
    this.url = url;
    this.dbName = dbName;
  }

  async connect() {
    this.#client = new MongoClient(this.url);
    await this.#client.connect();
    this.#db = this.#client.db(this.dbName);
    console.log("DB connected");
  }

  getCollection(name) {
    if (!this.#db) throw new Error("DB not connected");
    return this.#db.collection(name);
  }
}

export default DB;
