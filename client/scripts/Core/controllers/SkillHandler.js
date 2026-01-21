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
    if (!this.user || !this.user.user.role != "HR") return { ok: false, data: "You are not authorized to edit skills" }
    try {
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
    if (!this.user || !this.user.user.role != "HR") return { ok: false, data: "You are not authorized to delete skills" }
    try {
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


