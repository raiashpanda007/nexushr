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
}



export default SkillHandler


