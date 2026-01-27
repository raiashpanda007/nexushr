import { syncQueueHandler } from "../startup.js";
class Permissions {
  constructor(userState, userRepo, deptRepo, skillRepo, leaveTypeRepo) {
    this.user = userState;
    this.deptRepo = deptRepo;
    this.userRepo = userRepo;
    this.skillRepo = skillRepo;
    this.leaveTypeRepo = leaveTypeRepo;
  }

  async CreateDept(name, description) {
    if ((!this.user) || (this.user.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Create departments" };
    if (!name || !description) {
      return {
        ok: false,
        data: "Please provide every field"
      }
    }
    try {
      const sync = await syncQueueHandler.AddItemToQueue("departments", "create", {
        name,
        description
      });
      console.log("Sync Queue Response Create department : ", sync);
      if (!sync.ok) {
        return {
          ok: false,
          data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
        }
      }
      const { ok, data } = await this.deptRepo.Create(name, description);

      return {
        ok,
        data
      }
    } catch (e) {
      console.error("Create Dept Controller :: ", e);
      return {
        ok: false,
        data: e.data
      }
    }

  }




  async GetDepartment(id) {
    if ((!this.user) || (this.user.user.role != "HR")) return { ok: false, data: "Only HR/Admin can get department" };
    try {
      const dept = await this.deptRepo.GetDepartment(id);
      return {
        ok: true,
        data: dept
      }
    } catch (e) {
      console.error("Get Department Controller :: ", er);
      return {
        ok: false,
        data: String(e)
      }
    }

  }

  async CreateSkill(name, category) {
    if ((!this.user) || (this.user.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Create a skill" };

    try {
      if (!name || !category) {
        return {
          ok: false,
          data: "Please provide every field"
        }
      }
      const sync = await syncQueueHandler.AddItemToQueue("skills", "create", {
        name,
        category
      });
      console.log("Sync Queue Response Create skill : ", sync);
      if (!sync.ok) {
        return {
          ok: false,
          data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
        }
      }
      const { ok, data } = await this.skillRepo.Create(name, category);
      return {
        ok, data
      }
    } catch (e) {
      console.error("Error in creating new skill :: ", e);
      return {
        ok: false,
        data: e.data
      }
    }
  }

  async CreateLeaveType(code, name, length) {
    if ((!this.user) || (this.user.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Create leave type" };

    if (!name || !code || !length) {
      return {
        ok: false,
        data: "Please provide every field"
      }
    }
    console.log(name, code, length);
    if (length === "full" || length === "half") {
      try {
        const sync = await syncQueueHandler.AddItemToQueue("leaveTypes", "create", {
          code,
          name,
          length
        });
        console.log("Sync Queue Response Create leave type : ", sync);
        if (!sync.ok) {
          return {
            ok: false,
            data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
          }
        }
        const { ok, data } = await this.leaveTypeRepo.Create(code, name, length);
        return {
          ok,
          data
        }
      } catch (e) {
        console.error("Error in creating new leave type  :: ", e);
        return {
          ok: false,
          data: e.data
        }
      }

    } else {
      return {
        ok: false,
        data: "Please provide a valid leave type length"
      }
    }

  }

  async CreateUser(email, firstName, lastName, password, skillId, profilePhoto, note, department) {
    if ((!this.user) || (this.user.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Create user" };

    if (!email || !firstName || !lastName || !password || !department) {
      return {
        ok: false,
        data: "Please provide all required fields"
      }
    }
    try {
      const sync = await syncQueueHandler.AddItemToQueue("users", "create", {
        email,
        firstName,
        lastName,
        password,
        profilePhoto,
        note,
        skillId,
        department
      });
      console.log("Sync Queue Response Create user : ", sync);
      if (!sync.ok) {
        return {
          ok: false,
          data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
        }
      }
      const userId = await this.userRepo.Create(email, firstName, lastName, password, profilePhoto, note, skillId, department);

      return {
        ok: true,
        data: userId
      }
    } catch (e) {
      console.error("Error in creating new user :: ", e);
      return {
        ok: false,
        data: e.message || String(e)
      }
    }
  }

};

export default Permissions;
