import { syncQueueHandler } from "../startup.js";
class SkillHandler {
  constructor(skillRepo, userState) {
    this.skillRepo = skillRepo;
    this.user = userState;
  }

  async GetAllSkills() {
    if (!this.user) return { ok: false, data: "Please login first " }
    try {
      const { ok, data } = await this.skillRepo.GetAllSkills();
      return {
        ok,
        data
      }
    } catch (e) {
      console.error("Get all skill controller :: ", e)
      return {
        ok: false,
        data: String(e)
      }
    }
  }
  async EditSkill(id, name, category) {
    if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "HR") return { ok: false, data: "You are not authorized to edit skills" }
    try {
      const sync = await syncQueueHandler.AddItemToQueue("skills", "edit", {
        id,
        name,
        category
      });
      console.log("Sync Queue Response: ", sync);
      if (!sync.ok) {
        return {
          ok: false,
          data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
        }
      }
      const { ok, data } = await this.skillRepo.EditSkill(id, name, category);
      return {
        ok,
        data
      }
    } catch (e) {
      console.error("Edit skill controller :: ", e)
      return {
        ok: false,
        data: String(e)
      }
    }
  }
  async DeleteSkill(id) {
    if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "HR") return { ok: false, data: "You are not authorized to delete skills" }
    try {
      const sync = await syncQueueHandler.AddItemToQueue("skills", "delete", {
        id
      });
      console.log("Sync Queue Response: ", sync);
      if (!sync.ok) {
        return {
          ok: false,
          data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
        }
      }
      const { ok, data } = await this.skillRepo.DeleteSkill(id);
      return {
        ok,
        data
      }
    } catch (e) {
      console.error("Delete skill controller :: ", e)
      return {
        ok: false,
        data: String(e)
      }
    }
  }
}



export default SkillHandler


