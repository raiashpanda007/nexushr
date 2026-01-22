class PayrollRepo {
    constructor(db) {
        this.db = db;
    }

    CreatePayroll(userId, userFirstName, userLastName, month, year, salary, bonuses, deductions, total) {
        const id = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const request = this.db.tx("payrolls", "readwrite").add({
                id,
                userId,
                userFirstName,
                userLastName,
                month,
                year,
                salary,
                bonuses,
                deductions,
                total,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            request.onsuccess = () => resolve({
                ok: true,
                data: id
            });
            request.onerror = () => reject({
                ok: false,
                data: request.error
            });
        })
    }
    GetAllPayroll() {
        return new Promise((resolve, reject) => {
            const request = this.db.tx("payrolls").getAll();
            request.onsuccess = () => resolve({
                ok: true,
                data: request.result
            });
            request.onerror = () => reject({
                ok: false,
                data: request.error
            });
        })
    }
    GetAllPayrollByUserId(userId) {
        return new Promise((resolve, reject) => {
            const request = this.db.tx("payrolls").index("userID_indx").getAll(userId);
            request.onsuccess = () => resolve({
                ok: true,
                data: request.result
            });
            request.onerror = () => reject({
                ok: false,
                data: request.error
            });
        })
    }
    GetAllPayrollByMonth(month) {
        return new Promise((resolve, reject) => {
            const request = this.db.tx("payrolls").index("month_indx").getAll(month);
            request.onsuccess = () => resolve({
                ok: true,
                data: request.result
            });
            request.onerror = () => reject({
                ok: false,
                data: request.error
            });
        })
    }
    GetAllPayrollByYear(year) {
        return new Promise((resolve, reject) => {
            const request = this.db.tx("payrolls").index("year_indx").getAll(year);
            request.onsuccess = () => resolve({
                ok: true,
                data: request.result
            });
            request.onerror = () => reject({
                ok: false,
                data: request.error
            });
        })
    }

}

export default PayrollRepo;