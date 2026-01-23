import {syncQueueHandler} from "../startup.js";
class UserHandler {
  constructor(userRepo, userState) {
    this.repo = userRepo;
    this.user = userState;
  }

  async CreateUser(email, firstName, lastName, password, profilePhoto, noteComment, skills, department) {
    if ((!this.user) || (!this.user.data) || (!this.user.data.user) || (this.user.data.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Create new Employess" };
    try {
      const startSync = await syncQueueHandler.AddItemToQueue("users", "create", {
        email,
        firstName,
        lastName,
        password,
        profilePhoto,
        noteComment,
        skills,
        department
      });
      console.log("Start Sync Response: ", startSync);
      if (!startSync.ok) {
        return {
          ok: false,
          data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + startSync.data
        }
      }
      const data = await this.repo.Create(
        email, firstName, lastName, password, profilePhoto, noteComment, skills, department
      );
      return {
        ok: true,
        data
      }
    } catch (e) {
      console.error("Create User Controller :: ", e);
      return {
        ok: false,
        data: e.message || String(e)
      }
    }
  }

  async GetAllUser() {
    if ((!this.user) || (!this.user.data) || (!this.user.data.user) || (this.user.data.user.role != "HR")) return { ok: false, data: "Only HR/Admin can see all Employess" };
    try {
      const data = await this.repo.GetAllUser();
      return {
        ok: true,
        data
      }
    } catch (error) {
      console.error("Get All User Controller :: ", error);
      return {
        ok: false,
        data: error.message || String(error)
      }
    }
  }
  async EditUser(id, email, firstName, lastName, password, profilePhoto, noteComment, skills, department) {
    if ((!this.user) || (!this.user.data) || (!this.user.data.user) || (this.user.data.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Edit Employess" };
    try {
      const startSync = await syncQueueHandler.AddItemToQueue("users", "edit", {
        id,
        email,
        firstName,
        lastName,
        password,
        profilePhoto,
        noteComment,
        skills,
        department
      });
      if (!startSync.ok) {
        return {
          ok: false,
          data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + startSync.data
        }
      }

      const data = await this.repo.EditUser(id, email, firstName, lastName, password, profilePhoto, noteComment, skills, department);
      return {
        ok: true,
        data
      }
    } catch (error) {
      console.error("Edit User Controller :: ", error);
      return {
        ok: false,
        data: error.message || String(error)
      }
    }

  }

  async DeleteUser(id) {
    if ((!this.user) || (!this.user.data) || (!this.user.data.user) || (this.user.data.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Delete Employess" };
    try {
      const startSync = await syncQueueHandler.AddItemToQueue("users", "delete", {
        id
      });
      if (!startSync.ok) {
        return {
          ok: false,
          data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + startSync.data
        }
      }
      const data = await this.repo.DeleteUser(id);
      return {
        ok: true,
        data
      }
    } catch (error) {
      console.error("Delete User Controller :: ", error);
      return {
        ok: false,
        data: error.message || String(error)
      }
    }
  }



}

export default UserHandler;
