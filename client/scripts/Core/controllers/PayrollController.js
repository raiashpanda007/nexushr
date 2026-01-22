class PayrollController {
    constructor(repo, userState) {
        this.payrollRepo = repo;
        this.user = userState
    }
    async CreatePayroll(userId, userFirstName, userLastName, month, year, salary, bonuses, deductions, total) {
        if (!this.user || !this.user.data.isAuthenticated || this.user.data.user.role !== "HR") {
            return {
                ok: false,
                data: "Only HR can create payrolls"
            }
        }
        if (total < 0) {
            return {
                ok: false,
                data: "Total salary cannot be negative"
            }
        }
        try {
            const { ok, data } = await this.payrollRepo.CreatePayroll(userId, userFirstName, userLastName, month, year, salary, bonuses, deductions, total);
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Create Payroll Controller :: ", error);
            return {
                ok: false,
                data: error.message || String(error)
            }
        }
    }
    async GetAllPayroll() {
        if (!this.user || !this.user.data.isAuthenticated) return {
            ok: false,
            data: "User is not authenticated"
        }
        try {
            const { ok, data } = await this.payrollRepo.GetAllPayroll();
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Get All Payroll Controller :: ", error);
            return {
                ok: false,
                data: error.message || String(error)
            }
        }
    }
    async GetAllPayrollByUserId(userId) {
        if (!this.user || !this.user.data.isAuthenticated) return {
            ok: false,
            data: "User is not authenticated"
        }
        try {
            const { ok, data } = await this.payrollRepo.GetAllPayrollByUserId(userId);
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Get All Payroll By User ID Controller :: ", error);
            return {
                ok: false,
                data: error.message || String(error)
            }
        }
    }
    async GetAllPayrollByMonth(month) {
        if (!this.user || !this.user.data.isAuthenticated) return {
            ok: false,
            data: "User is not authenticated"
        }
        try {
            const { ok, data } = await this.payrollRepo.GetAllPayrollByMonth(month);
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Get All Payroll By Month Controller :: ", error);
            return {
                ok: false,
                data: error.message || String(error)
            }
        }
    }
    async GetAllPayrollByYear(year) {
        if (!this.user || !this.user.data.isAuthenticated) return {
            ok: false,
            data: "User is not authenticated"
        }
        try {
            const { ok, data } = await this.payrollRepo.GetAllPayrollByYear(year);
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Get All Payroll By Year Controller :: ", error);
            return {
                ok: false,
                data: error.message || String(error)
            }
        }
    }
}

export default PayrollController;