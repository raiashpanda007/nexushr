class DepartmentRepo {
  constructor(db) {
    this.db = db;
  }


  Create(name, description) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();

      let store;
      try {
        store = this.db.tx("departments", "readwrite");
      } catch (err) {
        return reject({
          ok: false,
          data: "Department table doesn't exists"
        });
      }

      const request = store.add({
        id,
        name: name.trim(),
        description: description?.trim() ?? "",
        empCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      request.onsuccess = () => {
        resolve({ ok: true, data: id });
      };

      request.onerror = () => {
        reject({ ok: false, data: request.error });
      };
    });
  }


  GetAllDepartments() {
    return new Promise((res, rej) => {
      const deptStore = this.db.tx("departments");
      const req = deptStore.openCursor();
      const results = [];
      req.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          res({
            ok: true,
            data: results
          });
        }
      }
      req.onerror = () => {
        rej({
          ok: false,
          data: req.error
        });
      }

    })
  }
  GetDepartment(id) {
    return new Promise((resolve, reject) => {
      const deptStore = this.db.tx("departments");
      const request = deptStore.get(id);
      request.onsuccess = (event) => {
        const dept = event.target.result;
        resolve({
          ok: true,
          data: dept
        });
      };
      request.onerror = () => reject({
        ok: false,
        data: request.error
      });
    })
  }
  EditDepartment(id, name, description) {
    return new Promise((resolve, reject) => {
      const deptStore = this.db.tx("departments", "readwrite");
      const request = deptStore.get(id);
      request.onsuccess = (event) => {
        const dept = event.target.result;
        dept.name = name;
        dept.description = description;
        dept.updatedAt = new Date().toISOString();
        const updateRequest = deptStore.put(dept);
        updateRequest.onsuccess = () => {
          resolve({
            ok: true,
            data: dept
          });
        };
        updateRequest.onerror = () => reject({
          ok: false,
          data: updateRequest.error
        });
      };
      request.onerror = () => reject({
        ok: false,
        data: request.error
      });
    })
  }
  DeleteDepartment(id) {
    return new Promise((resolve, reject) => {
      const deptStore = this.db.tx("departments", "readwrite");
      const request = deptStore.delete(id);
      request.onsuccess = () => {
        resolve({
          ok: true,
          data: id
        });
      };
      request.onerror = () => reject({
        ok: false,
        data: request.error
      });
    })
  }

}

export default DepartmentRepo; 
