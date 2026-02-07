import { IndexedDBManager } from "./db/InitDb.js";
import UserRepo from "./db/UserRepo.js";
import AuthState from "./controllers/AuthHandler.js";
import DepartmentRepo from "./db/DepartmentRepo.js";
import UserPermissions from "./controllers/UserPermissions.js";
import SkillRepo from "./db/SkillsRepo.js";
import LeaveTypeRepo from "./db/LeaveTypeRepo.js";
import DepartmentHandler from "./controllers/DepartmentHandler.js";
import SkillHandler from "./controllers/SkillHandler.js";
import UserHandler from "./controllers/UserHandler.js";
import LeaveTypeHandler from "./controllers/LeaveTypeHandler.js";
import AttendanceRepo from "./db/AttendanceRepo.js";
import AttendanceHandler from "./controllers/AttendanceHandler.js";
import SalaryRepo from "./db/SalaryRepo.js";
import SalaryHandler from "./controllers/SalaryHandler.js";
import PayrollRepo from "./db/PayrollRepo.js";
import PayrollController from "./controllers/PayrollController.js";
import LeaveApplicationRepo from "./db/LeaveApplicationRepo.js";
import LeaveApplicationHandler from "./controllers/LeaveApplicationHandler.js";
import SocketHandler from "../../scripts/Core/SocketHandler.js";
import SyncQueueRepo from "./db/SyncRepo.js";
import SyncQueueHandler from "./controllers/SyncHandler.js";
import NetworkStateHandler from "./controllers/NetworkStateHandler.js";
import { LongPolling } from "../utils.js";
import SSEHandler from "./SSEhandler.js";
import AnalysisHandler from "./controllers/AnalysisHandler.js";
import { seedOnUpgrade } from "./seed.js";
export const dbManager = new IndexedDBManager(
  "nexus_hr",
  1,
  (db, event) => {


    if (!db.objectStoreNames.contains("tenants")) {
      const tenants = db.createObjectStore("tenants", { keyPath: "id" });
    }





    if (!db.objectStoreNames.contains("users")) {
      const users = db.createObjectStore("users", { keyPath: "id" });

      users.createIndex("email_indx", "email", { unique: true });
      users.createIndex("deptID_indx", "deptId");
      users.createIndex("role_indx", "role");
      users.createIndex("online_indx", "online");

      const store = event.target.transaction.objectStore("users");
      store.add({
        id: "1",
        email: "admin@nexushr.com",
        firstName: "admin",
        lastName: "chacha",
        password: "12345678",
        role: "ADMIN",
        online: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    if (!db.objectStoreNames.contains("departments")) {
      const departments = db.createObjectStore("departments", { keyPath: "id" });
      departments.createIndex("name_indx", "name", { unique: true });
    }

    if (!db.objectStoreNames.contains("skills")) {
      const skills = db.createObjectStore("skills", { keyPath: "id" });
      skills.createIndex("category_indx", "category", { unique: false });
    }

    if (!db.objectStoreNames.contains("skills_users")) {
      const skills_users = db.createObjectStore("skills_users", { keyPath: "id" });
    }

    if (!db.objectStoreNames.contains("leave_types")) {
      const leave_types = db.createObjectStore("leave_types", { keyPath: "id" });
      leave_types.createIndex("code_indx", "code", { unique: false });
    }
    if (!db.objectStoreNames.contains("salaries")) {
      const salaries = db.createObjectStore("salaries", { keyPath: "id" });
      salaries.createIndex("userID_indx", "userId", { unique: false });
    }
    if (!db.objectStoreNames.contains("attendance")) {
      const attendance = db.createObjectStore("attendance", { keyPath: "id" });
      attendance.createIndex("userID_indx", "userId", { unique: false });
      attendance.createIndex("type_indx", "type", { unique: false });
      attendance.createIndex("entry_date_indx", "entryDate", { unique: false });
      attendance.createIndex("exit_date_indx", "exitDate", { unique: false });
    }
    if (!db.objectStoreNames.contains("payrolls")) {
      const payrolls = db.createObjectStore("payrolls", { keyPath: "id" });
      payrolls.createIndex("userID_indx", "userId", { unique: false });
      payrolls.createIndex("month_indx", "month", { unique: false });
      payrolls.createIndex("year_indx", "year", { unique: false });
    }
    if (!db.objectStoreNames.contains("leaves_applications")) {
      const leaves_applications = db.createObjectStore("leaves_applications", { keyPath: "id" });
      leaves_applications.createIndex("userID_index", "userId", { unique: false })
      leaves_applications.createIndex("status_index", "status", { unique: false })

    }


    if (!db.objectStoreNames.contains("sync_queue")) {
      const sync_queue = db.createObjectStore("sync_queue", { keyPath: "id", autoIncrement: true });
      sync_queue.createIndex("table_indx", "table", { unique: false });
      sync_queue.createIndex("operation_indx", "operation", { unique: false });
    }

    if (event.oldVersion < 1) {
      seedOnUpgrade(event.target.transaction);
    }
  }
);

await dbManager.init();



export const syncQueueRepo = new SyncQueueRepo(dbManager);
export const networkState = new NetworkStateHandler();
export const syncQueueHandler = new SyncQueueHandler(syncQueueRepo, networkState);


export const userRepo = new UserRepo(dbManager);
export const deptRepo = new DepartmentRepo(dbManager);
export const skillRepo = new SkillRepo(dbManager);
export const leaveTypeRepo = new LeaveTypeRepo(dbManager);
export const authState = new AuthState(userRepo);
export const deptHandler = new DepartmentHandler(deptRepo, authState.GetCurrUserState());
export const skillHandler = new SkillHandler(skillRepo, authState.GetCurrUserState());
export const attendanceRepo = new AttendanceRepo(dbManager);
export const attendanceHandler = new AttendanceHandler(attendanceRepo, authState);
export const userHandler = new UserHandler(userRepo, authState.GetCurrUserState());
export const leaveTypeHandler = new LeaveTypeHandler(leaveTypeRepo, authState.GetCurrUserState());
export const salaryRepo = new SalaryRepo(dbManager);
export const salaryHandler = new SalaryHandler(salaryRepo, authState.GetCurrUserState());
export const payrollRepo = new PayrollRepo(dbManager);
export const payrollHandler = new PayrollController(payrollRepo, authState.GetCurrUserState());
export const leaveApplicationRepo = new LeaveApplicationRepo(dbManager);
export const leaveApplicationHandler = new LeaveApplicationHandler(dbManager, leaveApplicationRepo, authState.GetCurrUserState());
export const permissions = new UserPermissions(authState.GetCurrUserState().data, userRepo, deptRepo, skillRepo, leaveTypeRepo);
export const sseHandler = new SSEHandler('http://localhost:3000/events');

export const analysisHandler = new AnalysisHandler(leaveApplicationHandler, attendanceHandler, salaryHandler, userHandler, skillHandler, deptHandler, authState.GetCurrUserState());

sseHandler.connect();



const useSocket = new SocketHandler(authState);
useSocket.connect();


export const socketHandler = useSocket;
LongPolling();




