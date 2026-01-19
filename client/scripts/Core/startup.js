import { IndexedDBManager } from "./db/InitDb.js";
import UserRepo from "./db/UserRepo.js";
import AuthState from "./controllers/AuthHandler.js";
export const dbManager = new IndexedDBManager(
  "nexus_hr",
  1,
  (db, event) => {

    if (!db.objectStoreNames.contains("users")) {
      const users = db.createObjectStore("users", { keyPath: "id" });
      users.createIndex("email_indx", "email", { unique: true });
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
);

await dbManager.init();



export const userRepo = new UserRepo(dbManager);



export const authState = new AuthState(userRepo);
