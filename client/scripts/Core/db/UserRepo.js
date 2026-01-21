class UserRepo {
  constructor(db) {
    this.user = null;
    this.db = db;
  }
  Create(email, firstName, lastName, password, profilePhoto, noteComment, skills, department) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const req = this.db.tx("users", "readwrite").add({
        id,
        email,
        firstName,
        lastName,
        password,
        role: "EMP",
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

  EditUser(id, email, firstName, lastName, password, profilePhoto, noteComment, skills, department) {
    return new Promise((resolve, reject) => {
      const userStore = this.db.tx("users", "readwrite");
      const req = userStore.get(id);
      req.onsuccess = (event) => {
        const user = event.target.result;
        user.email = email;
        user.firstName = firstName;
        user.lastName = lastName;
        user.password = password;
        user.profilePhoto = profilePhoto;
        user.note = noteComment;
        user.skills = skills;
        user.department = department;
        user.updatedAt = new Date().toISOString();
        userStore.put(user);
        resolve({
          ok: true,
          data: user
        });
      };
      req.onerror = () => {
        console.error("Edit user controller :: ", req.error);
        reject({
          ok: false,
          data: req.error
        });
      };
    })

  }
  DeleteUser(id) {
    return new Promise((resolve, reject) => {
      const userStore = this.db.tx("users", "readwrite");
      const req = userStore.delete(id);
      req.onsuccess = () => resolve({ ok: true, data: id });
      req.onerror = () => reject({ ok: false, data: req.error });
    })
  }
}


export default UserRepo;
