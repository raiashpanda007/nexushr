class AuthState {
  constructor(userRepo) {
    this.repo = userRepo;
    this.userState = null;
  }

  async Login(email, password) {
    try {
      const req = await this.repo.GetUserByEmail(email);
      if (req.password === password) {
        this.userState = Object.freeze({
          isAuthenticated: true,
          user: req
        });
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

}



export default AuthState;
