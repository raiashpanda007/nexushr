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
      createdAt: new Date(),
      updatedAt: new Date()
    });

  }

}


export default UserRepo;
