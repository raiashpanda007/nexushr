class UserRepo {
  constructor(db) {
    this.user = null;
    this.db = db;
  }
  Create(email, firstName, lastName, password, deptId, profilePhoto, noteComment) {
    const id = crypto.randomUUID();
    return this.db.tx("users", "readwrite").add({
      id,
      email,
      firstName,
      lastName,
      password,
      role: "EMP",
      deptId,
      profilePhoto,
      note: noteComment,
      online: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

  }

  GetUserByEmail(email) {
    return new Promise((resolve, reject) => {
      const req = this.db.tx("users").index("email_indx").get(email);

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
}


export default UserRepo;
