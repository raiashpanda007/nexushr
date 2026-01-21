class LeaveTypeRepo {
  constructor(db) {
    this.db = db;
  }


  Create(code, name, length) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      let leaveTypeStore;
      try {
        leaveTypeStore = this.db.tx("leave_types", "readwrite");
      } catch (e) {
        return reject({
          ok: false,
          data: "Leave type doesn't exists"
        })
      }
      const request = leaveTypeStore.add({
        id,
        code,
        name,
        length
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
  GetAllLeaveTypes() {
    return new Promise((resolve, reject) => {
      const leaveTypeStore = this.db.tx("leave_types");
      const request = leaveTypeStore.openCursor();
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
          });
        }
      }
      request.onerror = () => {
        reject({
          ok: false,
          data: req.error
        });
      }

    })
  }

  GetLeaveTypeById(id) {
    return new Promise((resolve, reject) => {
      const leaveTypeStore = this.db.tx("leave_types");
      const request = leaveTypeStore.get(id);
      request.onsuccess = (event) => {
        const leaveType = event.target.result;
        resolve({
          ok: true,
          data: leaveType
        });
      };
      request.onerror = () => reject({
        ok: false,
        data: request.error
      });
    })
  }
  GetLeaveTypeByCode(code) {
    return new Promise((resolve, reject) => {
      const request = this.db.tx("leave_types").index("code_indx").get(code);

      request.onsuccess = () => {
        resolve({
          ok: true,
          data: request.result
        })
      }
      request.onerror = () => [
        reject({
          ok: false,
          data: request.error
        })
      ]
    })
  }

  EditLeaveType(id, code, name, length) {
    return new Promise((resolve, reject) => {
      const store = this.db.tx("leave_types", "readwrite");
      const request = store.get(id);
      request.onsuccess = (event) => {
        const leaveType = event.target.result;
        leaveType.code = code;
        leaveType.name = name;
        leaveType.length = length;
        leaveType.updatedAt = new Date().toISOString();

        const updateRequest = store.put(leaveType);
        updateRequest.onsuccess = () => {
          resolve({
            ok: true,
            data: id
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
    });
  }

  DeleteLeaveType(id) {
    return new Promise((resolve, reject) => {
      const store = this.db.tx("leave_types", "readwrite");
      const request = store.delete(id);
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
    });
  }
}



export default LeaveTypeRepo;
