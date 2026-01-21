class DepartmentHandler {
  constructor(deptRepo, userState) {
    this.deptRepo = deptRepo;
    this.user = userState;
    console.log(this.user)
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

  async EditDepartment(id, name, description) {
    if (!this.user || this.user.data.user.role !== "HR") return { ok: false, data: "Please login first" }
    try {
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
    if (!this.user || this.user.data.user.role !== "HR") return { ok: false, data: "Please login first" }
    try {
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
