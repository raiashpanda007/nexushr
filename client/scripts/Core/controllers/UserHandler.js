class UserHandler {
  constructor(userRepo, userState) {
    this.repo = userRepo;
    this.user = userState;
  }

  async CreateUser(email, firstName, lastName, password, dept, profilePhoto, noteComment, skill, department) {
    console.log("User :: ", this.user);
    if ((!this.user) || (this.user.data.user.role != "HR")) return { ok: false, data: "Only HR/Admin can Create new Employess" };
    try {
      const data = await this.repo.Create(
        email, firstName, lastName, password, dept, profilePhoto, noteComment, skill, department
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

}



export default UserHandler;
