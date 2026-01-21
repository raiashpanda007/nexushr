class SalaryRepo {
    constructor(db) {
        this.db = db;
    }

    async Create(base, hra, lta, userId, userFirstName, userLastName, userDepartment) {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            let store;
            try {
                store = this.db.tx("salaries", "readwrite");
            } catch (err) {
                return reject({
                    ok: false,
                    data: "Salaries table doesn't exists"
                })
            }
            const request = store.add({
                id,
                base,
                hra,
                lta,
                userId,
                userFirstName,
                userLastName,
                userDepartment,
                createdAt: new Date().toISOString(),
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

    async GetAllSalariesByUserID(userId) {
        return new Promise((resolve, reject) => {
            const store = this.db.tx("salaries");
            const request = store.index("userId").getAll(userId);
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
    async GetAllSalaries() {
        return new Promise((resolve, reject) => {
            const store = this.db.tx("salaries");
            const request = store.getAll();
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
    DeleteSalary(id) {
        return new Promise((resolve, reject) => {
            const store = this.db.tx("salaries", "readwrite");
            const request = store.delete(id);
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

    EditSalary(id, base, hra, lta) {
        return new Promise((resolve, reject) => {
            const store = this.db.tx("salaries", "readwrite");
            const request = store.get(id);
            request.onsuccess = (event) => {
                const salary = event.target.result;
                salary.base = base;
                salary.hra = hra;
                salary.lta = lta;
                salary.updatedAt = new Date().toISOString();
                const updateRequest = store.put(salary);
                updateRequest.onsuccess = () => {
                    resolve({
                        ok: true,
                        data: salary
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
}


export default SalaryRepo;
