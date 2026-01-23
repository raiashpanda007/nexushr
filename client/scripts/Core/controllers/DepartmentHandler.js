import { syncQueueHandler } from "../startup.js";
class DepartmentHandler {
  constructor(deptRepo, userState) {
    this.deptRepo = deptRepo;
    this.user = userState;
    console.log(this.user)
  }

  async GetAllDepartments() {
    if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "HR") return { ok: false, data: "Please login first" }
    try {
      const { ok, data } = await this.deptRepo.GetAllDepartments();
      return {
        ok,
        data
      }
    } catch (e) {
      console.error("Get All Department Controller :: ", e)
      return {
        ok: false,
        data: String(e)
      }
    }

  }

  async EditDepartment(id, name, description) {
    if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "HR") return { ok: false, data: "Please login first" }
    try {
      const sync = await syncQueueHandler.AddItemToQueue("departments", "edit", {
        id,
        name,
        description
      });
      console.log("Sync Queue Response: ", sync);
      if (!sync.ok) {
        return {
          ok: false,
          data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
        }
      }
      const { ok, data } = await this.deptRepo.EditDepartment(id, name, description);
      return {
        ok,
        data
      }
    } catch (e) {
      console.error("Edit Department Controller :: ", e)
      return {
        ok: false,
        data: String(e)
      }
    }

  }


  async DeleteDepartment(id) {
    if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "HR") return { ok: false, data: "Please login first" }
    try {
      const sync = await syncQueueHandler.AddItemToQueue("departments", "delete", {
        id
      });
      console.log("Sync Queue Response: ", sync);
      if (!sync.ok) {
        return {
          ok: false,
          data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
        }
      }
      const { ok, data } = await this.deptRepo.DeleteDepartment(id);
      return {
        ok,
        data
      }
    } catch (e) {
      console.error("Delete Department Controller :: ", e)
      return {
        ok: false,
        data: String(e)
      }
    }
  }
}


export default DepartmentHandler;
