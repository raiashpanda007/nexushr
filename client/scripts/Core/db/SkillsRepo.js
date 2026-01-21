class SkillRepo {
  constructor(db) {
    this.db = db;
  }



  Create(name, category) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();


      let skillStore;
      try {
        skillStore = this.db.tx("skills", "readwrite");
      } catch (e) {
        return reject({
          ok: false,
          data: "Skills table doesn't exists"
        })
      }

      const request = skillStore.add({
        id,
        name,
        category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      request.onsuccess = () => {
        resolve({
          ok: true,
          data: id
        })
      }
      request.onerror = () => {
        reject({
          ok: false,
          data: request.error
        })
      }
    })
  }

  GetAllSkills() {
    return new Promise((resolve, reject) => {
      const skillStore = this.db.tx("skills");
      const request = skillStore.openCursor();
      const results = [];
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve({
            ok: true,
            data: results
          })
        }
      }
      request.onerror = () => {
        reject({
          ok: false,
          data: request.error
        })
      }
    })
  }

  GetAllSkillsByCategory(category) {
    return new Promise((resolve, reject) => {
      const request = this.db.tx("skills").index("category_indx").get(category);

      request.onsuccess = () => {
        resolve({
          ok: true,
          data: request.result
        })
      }
      request.onerror = () => {
        reject({
          ok: false,
          data: request.error
        })
      }


    })
  }

  GetSkillFromId(id) {
    return new Promise((resolve, reject) => {
      const skillStore = this.db.tx("skills");
      const request = skillStore.get(id);
      request.onsuccess = (event) => {
        const skill = event.target.result;
        resolve({
          ok: true,
          data: skill
        });
      }
      request.onerror = () => {
        reject({
          ok: false,
          data: request.error
        })
      }
    })
  }


  AttachSkillToUser(skill, user) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      let skill_users_store;

      try {
        skill_users_store = this.db.tx("skills_users", "readwrite");
      } catch (e) {
        console.error("Error in attaching a skill to user :: ", e);
        return {
          ok: false,
          data: "Skill_user table doesn't exists  "
        }
      }
      const request = skill_users_store.add({
        id,
        userID: user.id,
        skillID: skill.id,
        userName: user.firstName + user.lastName,
        userProfile: user.profilePhoto,
        userDept: user.dept,
        skillName: skill.name,
        skillCategory: skill.category
      });
      request.onsuccess = () => {
        resolve({
          ok: true,
          data: id
        })
      }
      request.onerror = () => {
        reject({
          ok: false,
          data: request.error
        })
      }
    })

  }

  GetAllUserBySkill(id) {
    return new Promise((resolve, reject) => {
      const usersSkills = this.db.tx("skills_users");
      const request = usersSkills.get(id);
      request.onsuccess = (event) => {
        const user_skill = event.target.result;
        resolve({
          ok: true,
          data: user_skill
        })
      }
      request.onerror = () => {
        reject({
          ok: false,
          data: request.error
        })
      }
    })
  }
  EditSkill(id, name, category) {
    return new Promise((resolve, reject) => {
      const skillStore = this.db.tx("skills", "readwrite");
      const request = skillStore.get(id);
      request.onsuccess = (event) => {
        const skill = event.target.result;
        skill.name = name;
        skill.category = category;
        skill.updatedAt = new Date().toISOString();
        const updateRequest = skillStore.put(skill);
        updateRequest.onsuccess = () => {
          resolve({
            ok: true,
            data: id
          })
        }
        updateRequest.onerror = () => {
          reject({
            ok: false,
            data: updateRequest.error
          })
        }
      }
      request.onerror = () => {
        reject({
          ok: false,
          data: request.error
        })
      }
    })
  }
  DeleteSkill(id) {
    return new Promise((resolve, reject) => {
      const skillStore = this.db.tx("skills", "readwrite");
      const request = skillStore.delete(id);
      request.onsuccess = () => {
        resolve({
          ok: true,
          data: id
        })
      }
      request.onerror = () => {
        reject({
          ok: false,
          data: request.error
        })
      }
    })
  }
}


export default SkillRepo;
