class DepartmentHandler {
  constructor(deptRepo, userState) {
    this.deptRepo = deptRepo;
    this.user = userState;
  }

  async GetAllDepartments() {
    if (!this.user) return { ok: false, data: "Pleas login first" }
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
}



export default DepartmentHandler;
