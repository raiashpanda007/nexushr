import { IndexedDBManager } from "./db/InitDb.js";
import UserRepo from "./db/UserRepo.js";

export const dbManager = new IndexedDBManager(
  "nexus_hr",
  1,
  (db, event) => {

    if (!db.objectStoreNames.contains("users")) {
      const users = db.createObjectStore("users", { keyPath: "id" });
      users.createIndex("deptID_indx", "deptId");
      users.createIndex("role_indx", "role");
      users.createIndex("online_indx", "online");

      const store = event.target.transaction.objectStore("users");
      store.add({
        id: "1",
        email: "admin@restroworks.com",
        firstName: "admin",
        lastName: "chacha",
        password: "12345678",
        role: "HR",
        online: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
);

await dbManager.init();

export const userRepo = new UserRepo(dbManager);
