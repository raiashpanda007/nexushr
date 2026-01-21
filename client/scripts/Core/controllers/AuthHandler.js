class AuthState {

  constructor(userRepo) {
    this.repo = userRepo;
    this.userState = null;
  }


  GetCurrUserState() {
    try {
      if (this.userState) return { ok: true, data: this.userState };
      const user = JSON.parse(localStorage.getItem("userDetails"));
      if (!user) {
        return {
          ok: false,
          data: ""
        }
      }
      this.userState = Object.freeze(user);
      return {
        ok: true,
        data: this.userState
      }

    } catch (e) {
      console.error("Error in GetCurrUserState :: ", e);
      return {
        ok: false,
        data: e
      }
    }
  }

  async Login(email, password) {
    try {
      const req = await this.repo.GetUserByEmail(email);
      if (req.password === password) {
        this.userState = Object.freeze({
          isAuthenticated: true,
          user: req
        });
        localStorage.setItem('userDetails', JSON.stringify(this.userState));
        return { ok: true, data: this.userState }
      }
      return {
        ok: false,
        data: "Invalid password"
      }
    } catch (e) {
      console.error(e);
      return {
        ok: false,
        data: "Invalid email"
      }

    }

  }
  async LogOut() {
    try {
      if (!this.userState) {
        return {
          ok: false,
          data: "Please login first "
        }
      }
      const offUser = await this.repo.SetUserOfflineById(this.userState.user.id);

      localStorage.removeItem("userDetails");
      return {
        ok: true,
        data: offUser
      }

    } catch (e) {
      console.error("error in logout :: ", e);
    }
  }

}



export default AuthState;
