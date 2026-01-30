class AttendanceRepo {
    constructor(db) {
        this.db = db;
    }
    Create(userId, type) {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            let attendanceStore;
            try {
                attendanceStore = this.db.tx("attendance", "readwrite");
            } catch (error) {
                return reject({
                    ok: false,
                    data: "Attendance table doesn't exists"
                })
            };

            let request;
            const now = new Date().toISOString();
            // Normalize type to uppercase
            const normalizedType = type.toUpperCase();

            if (normalizedType === "ENTRY" || normalizedType === "ENTER") {
                request = attendanceStore.add({
                    id,
                    userId,
                    type: normalizedType,
                    entryDate: now,
                    createdAt: now,
                });
            } else {
                request = attendanceStore.add({
                    id,
                    userId,
                    type: normalizedType,
                    exitDate: now,
                    createdAt: now,
                });
            }

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

    GetAttendanceByUser(userId) {
        return new Promise((resolve, reject) => {
            const attendanceStore = this.db.tx("attendance").index("userID_indx");
            const request = attendanceStore.getAll(userId);

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

    GetAllAttendance() {
        return new Promise((resolve, reject) => {
            const attendanceStore = this.db.tx("attendance");
            const request = attendanceStore.getAll();

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




}


export default AttendanceRepo;