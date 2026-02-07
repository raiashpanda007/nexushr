import mongoose from "mongoose"
class DB {
  #dbUrl = "";
  #dbName = "";
  constructor(url, name) {
    this.#dbUrl = url;
    this.#dbName = name;
  }

  async Connect() {

    try {
      const connectionDB = await mongoose.connect(this.#dbUrl ,{
        dbName: this.#dbName,
      });
      console.info("DB Connected :: ", connectionDB.connection.host);
    } catch (e) {
      console.error('Error in db/index :', e);
    }

  }

}

export default DB;
