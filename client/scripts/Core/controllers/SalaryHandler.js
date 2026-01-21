class SalaryHandler {
    constructor(salaryRepo, authState) {
        this.salaryRepo = salaryRepo;
        this.user = authState;
    }

    async CreateSalary(userId, base, hra, lta, userFirstName, userLastName, userDepartment) {
        console.log("user creating salary :: ", this.user);
        if (!this.user || this.user.data.user.role !== "HR") {
            return {
                ok: false,
                data: "Unauthorized"
            }
        }
        try {
            const data = await this.salaryRepo.Create(base, hra, lta, userId, userFirstName, userLastName, userDepartment);
            return {
                ok: true,
                data
            }
        } catch (error) {
            console.error("Create Salary Controller :: ", error);
            return {
                ok: false,
                data: error.message || String(error)
            }
        }
    }
    async GetAllSalariesByUserID(userId) {
        if (!this.user || !this.user.IsAuthenticated) {
            return {
                ok: false,
                data: "Unauthorized"
            }
        }
        try {
            const data = await this.salaryRepo.GetAllSalariesByUserID(userId);
            return {
                ok: true,
                data
            }
        } catch (error) {
            console.error("Get All Salaries Controller :: ", error);
            return {
                ok: false,
                data: error.message || String(error)
            }
        }
    }
    async GetAllSalaries() {
        if (!this.user || this.user.data.user.role !== "HR") {
            return {
                ok: false,
                data: "Unauthorized"
            }
        }
        try {
            const data = await this.salaryRepo.GetAllSalaries();
            return {
                ok: true,
                data
            }
        } catch (error) {
            console.error("Get All Salaries Controller :: ", error);
            return {
                ok: false,
                data: error.message || String(error)
            }
        }
    }
    async DeleteSalary(id) {
        if (!this.user || this.user.data.user.role != "HR") {
            return {
                ok: false,
                data: "Unauthorized"
            }
        }
        try {
            const data = await this.salaryRepo.DeleteSalary(id);
            return {
                ok: true,
                data
            }
        } catch (error) {
            console.error("Delete Salary Controller :: ", error);
            return {
                ok: false,
                data: error.message || String(error)
            }
        }
    }
    async EditSalary(id, base, hra, lta) {
        if (!this.user || this.user.data.user.role != "HR") {
            return {
                ok: false,
                data: "Unauthorized"
            }
        }
        try {
            const data = await this.salaryRepo.EditSalary(id, base, hra, lta);
            return {
                ok: true,
                data
            }
        } catch (error) {
            console.error("Edit Salary Controller :: ", error);
            return {
                ok: false,
                data: error.message || String(error)
            }
        }
    }

}

export default SalaryHandler;