class Permissions {
  constructor(userState, userRepo, deptRepo, skillRepo) {
    this.user = userState;
    this.deptRepo = deptRepo;
    this.userRepo = userRepo;
    this.skillRepo = skillRepo
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

  async GetAllDepartments() {

    if ((!this.user) || (this.user.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Create departments" };
    try {
      const allDepts = await this.deptRepo.GetAllDepartments();
      return {
        ok: true,
        data: allDepts
      }
    } catch (e) {
      console.error("Get All Department Controller :: ", e)
      return {
        ok: false,
        data: String(e)
      }
    }
  }


  async GetDepartment(id) {
    if ((!this.user) || (this.user.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Create departments" };
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
    if ((!this.user) || (this.user.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Create departments" };

    try {
      if (!name || !category) {
        return {
          ok: false,
          data: "Please provide every field"
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

};


export default Permissions;
