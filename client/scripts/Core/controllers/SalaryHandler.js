import {syncQueueHandler} from "../startup.js";
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
            const startSync = await syncQueueHandler.AddItemToQueue("salaries", "create", {
                userId,
                base,
                hra,
                lta,
                userFirstName,
                userLastName,
                userDepartment
            });
            console.log("Start Sync Response: ", startSync);
            if (!startSync.ok) {
                return {
                    ok: false,
                    data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + startSync.data
                }
            }
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
            const startSync = await syncQueueHandler.AddItemToQueue("salaries", "delete", {
                id
            });
            console.log("Start Sync Response: ", startSync);
            if (!startSync.ok) {
                return {
                    ok: false,
                    data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + startSync.data
                }
            }
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
            const startSync = await syncQueueHandler.AddItemToQueue("salaries", "edit", {
                id,
                base,
                hra,
                lta
            });
            console.log("Start Sync Response: ", startSync);
            if (!startSync.ok) {
                return {
                    ok: false,
                    data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + startSync.data
                }
            }
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