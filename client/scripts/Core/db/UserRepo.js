class UserRepo {
  constructor(db) {
    this.user = null;
    this.db = db;
  }
  Create(email, firstName, lastName, password, deptId, profilePhoto, noteComment, skills, department) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const req = this.db.tx("users", "readwrite").add({
        id,
        email,
        firstName,
        lastName,
        password,
        role: "EMP",
        deptId,
        department,
        profilePhoto,
        note: noteComment,
        online: false,
        skills,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      req.onsuccess = () => resolve(id);
      req.onerror = () => reject(req.error);
    });
  }

  GetUserByEmail(email) {
    return new Promise((resolve, reject) => {
      const req = this.db.tx("users").index("email_indx").get(email);

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  SetUserOfflineById(id) {
    return new Promise((resolve, reject) => {
      const userStore = this.db.tx("users", "readwrite");
      const req = userStore.get(id);
      req.onsuccess = (event) => {
        const user = event.target.result;
        user.online = false;
        userStore.put(user);
        resolve(user);
      };
      req.onerror = () => reject(req.error);

    })
  }
  SetUserOnlineById(id) {
    return new Promise((resolve, reject) => {
      const userStore = this.db.tx("users", "readwrite");
      const req = userStore.get(id);
      req.onsuccess = (event) => {
        const user = event.target.result;
        user.online = true;
        userStore.put(user);
        resolve(user);
      };
      req.onerror = () => reject(req.error);

    })
  }

  async GetAllUser() {
    return new Promise((resolve, reject) => {
      const userStore = this.db.tx("users");
      const req = userStore.getAll();
      req.onsuccess = () => resolve({ ok: true, data: req.result });
      req.onerror = () => reject({ ok: false, data: req.error });
    }
    )


  }

}


export default UserRepo;
