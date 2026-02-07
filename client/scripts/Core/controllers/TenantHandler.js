import { syncQueueHandler } from "../startup.js";

class TenantHandler {
    constructor(tenantRepo, authState, userRepo) {
        this.repo = tenantRepo;
        this.user = authState
        this.userRepo = userRepo
    }

    async CreateHR(email, firstName, lastName, password, profilePhoto, note, tenantId) {
        if (!email || !firstName || !lastName || !password || !tenantId) return { ok: false, data: "Missing required fields" }
        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "ADMIN") return { ok: false, data: "Unauthorized" }
        try {
            const sync = await syncQueueHandler.AddItemToQueue("users", "create", {
                email,
                firstName,
                lastName,
                password,
                profilePhoto,
                note,
                tenantId
            });
            console.log("Sync Queue Response Create user : ", sync);
            if (!sync.ok) {
                return {
                    ok: false,
                    data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
                }
            }
            const { ok, data } = await this.userRepo.Create(email, firstName, lastName, password, profilePhoto, note, tenantId);
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Create HR handler error :: ", error);
            return {
                ok: false,
                data: String(error)
            }
        }
    }

    async CreateTenant(name, HRdetails) {

        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "ADMIN") return { ok: false, data: "Unauthorized" }
        if (!name || !HRdetails) return { ok: false, data: "Missing required fields" }
        const tenantId = crypto.randomUUID();
        try {
            const sync = await syncQueueHandler.AddItemToQueue("tenants", "create", {
                name,
                HRdetails,
                adminUserDetails: this.user.data.user
            });
            console.log("Sync Queue Response: ", sync);
            if (!sync.ok) {
                return {
                    ok: false,
                    data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
                }
            }
            const res = await this.CreateHR(HRdetails.email, HRdetails.firstName, HRdetails.lastName, HRdetails.password, HRdetails.profilePhoto, HRdetails.note, tenantId);
            if (!res.ok) {
                return {
                    ok: false,
                    data: "Unable to create HR: " + res.data
                }
            }
            const { ok, data } = await this.repo.Create(tenantId, name, res.data, this.user.data.user);
            return {
                ok,
                data
            }


        } catch (error) {
            console.error("Create tenant handler error :: ", error);
            return {
                ok: false,
                data: String(error)
            }
        }
    }


    async AddNewHR(tenantId, HRdetails) {
        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "ADMIN") return { ok: false, data: "Unauthorized" }
        if (!tenantId || !HRdetails) return { ok: false, data: "Missing required fields" }
        try {
            const sync = await syncQueueHandler.AddItemToQueue("users", "create", {
                email,
                firstName,
                lastName,
                password,
                profilePhoto,
                note,
                tenantId
            });
            console.log("Sync Queue Response Create user : ", sync);
            if (!sync.ok) {
                return {
                    ok: false,
                    data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
                }
            }
            const res = this.CreateHR(HRdetails.email, HRdetails.firstName, HRdetails.lastName, HRdetails.password, HRdetails.profilePhoto, HRdetails.note, tenantId);
            if (!res.ok) {
                return {
                    ok: false,
                    data: "Unable to create HR: " + res.data
                }
            }
            const { ok, data } = await this.repo.AddHRToTenant(tenantId, res.data);
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Add new HR handler error :: ", error);
            return {
                ok: false,
                data: String(error)
            }
        }
    }

    async UpdateHR(tenantId, HRDetails) {
        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "ADMIN") return { ok: false, data: "Unauthorized" }
        if (!tenantId || !HRDetails) return { ok: false, data: "Missing required fields" }
        try {
            const sync = await syncQueueHandler.AddItemToQueue("users", "update", {
                tenantId,
                HRDetails
            });
            console.log("Sync Queue Response Update user : ", sync);
            if (!sync.ok) {
                return {
                    ok: false,
                    data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
                }
            }
            const { ok, data } = await this.userRepo.UpdateHR(HRDetails.id, HRDetails.email, HRDetails.firstName, HRDetails.lastName, HRDetails.password, HRDetails.profilePhoto, HRDetails.note);
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Update HR handler error :: ", error);
            return {
                ok: false,
                data: String(error)
            }
        }
    }

    async DeleteHRFromTenant(tenantId, HRAdminId) {
        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "ADMIN") return { ok: false, data: "Unauthorized" }
        if (!tenantId || !HRAdminId) return { ok: false, data: "Missing required fields" }
        try {
            const sync = await syncQueueHandler.AddItemToQueue("users", "delete", {
                tenantId,
                HRAdminId
            });
            console.log("Sync Queue Response Delete user : ", sync);
            if (!sync.ok) {
                return {
                    ok: false,
                    data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
                }
            }
            const { ok, data } = await this.repo.RemoveHRFromTenant(tenantId, HRAdminId);
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Delete HR from tenant handler error :: ", error);
            return {
                ok: false,
                data: String(error)
            }
        }
    }

    async GetTenantById(tenantId) {
        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "ADMIN") return { ok: false, data: "Unauthorized" }
        if (!tenantId) return { ok: false, data: "Missing required fields" }
        try {
            const { ok, data } = await this.repo.GetTenantById(tenantId);
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Get tenant details by id handler error :: ", error);
            return {
                ok: false,
                data: String(error)
            }
        }
    }

    async GetAllTenant() {
        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "ADMIN") return { ok: false, data: "Unauthorized" }
        try {
            const { ok, data } = await this.repo.GetAllTenant();
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Get all tenant handler error :: ", error);
            return {
                ok: false,
                data: String(error)
            }
        }
    }

    async DeleteTenant(tenantId) {
        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "ADMIN") return { ok: false, data: "Unauthorized" }
        if (!tenantId) return { ok: false, data: "Missing required fields" }
        try {
            const { ok, data } = await this.repo.DeleteTenant(tenantId);
            return {
                ok,
                data
            }
        } catch (error) {
            console.error("Delete tenant handler error :: ", error);
            return {
                ok: false,
                data: String(error)
            }
        }
    }


}

export default TenantHandler