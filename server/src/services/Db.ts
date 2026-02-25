import mongoose from "mongoose"
class DB {
  private dbUrl: string;
  private dbName: string;
  constructor(url: string, name: string) {
    this.dbUrl = url;
    this.dbName = name;
  }

  public async Connect(): Promise<typeof mongoose> {

    try {
      const connectionDB = await mongoose.connect(this.dbUrl, {
        dbName: this.dbName,
      });
      console.info("DB Connected :: ", connectionDB.connection.host);
      return connectionDB;
      
    } catch (e) {
      console.error('Error in db/index :', e);
      process.exit(1);
    }

  }

}

export default DB;