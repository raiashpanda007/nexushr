class TenantsRepo {
    constructor(dbManager) {
        this.db = dbManager;
    }

    Create(tenantId, name, HRUserID, adminUserDetails) {
        return new Promise((resolve, reject) => {
            const request = this.db.tx("tenants", "readwrite").add({
                id: tenantId,
                name: name,
                HRUserID: [HRUserID],
                adminUserDetails: adminUserDetails,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            })
            request.onsuccess = () => {
                resolve({
                    ok: true,
                    data: request.result,
                });
            };
            request.onerror = () => {
                reject({
                    ok: false,
                    data: request.error,
                });
            };
        })

    }

    UpdateTenant(id, name) {
        return new Promise((resolve, reject) => {
            const tenantStore = this.db.tx("tenants", "readwrite");
            const request = tenantStore.get(id);
            request.onsuccess = (event) => {
                const tenant = event.target.result;
                tenant.name = name
                tenant.updatedAt = new Date().toISOString()
                const updateRequest = tenantStore.put(tenant);
                updateRequest.onsuccess = () => {
                    resolve({
                        ok: true,
                        data: tenant,
                    });
                };
                updateRequest.onerror = () => {
                    reject({
                        ok: false,
                        data: updateRequest.error,
                    });
                };
            };
            request.onerror = () => {
                reject({
                    ok: false,
                    data: request.error,
                });
            };
        })

    }


    AddHRToTenant(tenantId, HRAdminId) {
        return new Promise((resolve, reject) => {
            const tenantStore = this.db.tx("tenants", "readwrite");
            const request = tenantStore.get(tenantId);
            request.onsuccess = (event) => {
                const tenant = event.target.result;
                if (tenant.HRUserID.length >= 3) {
                    reject({
                        ok: false,
                        data: "Maximum HR Admins limit reached",
                    });
                    return;
                }
                const set = new Set(tenant.HRUserID);
                if (set.has(HRAdminId)) {
                    reject({
                        ok: false,
                        data: "HR Admin ID already exists",
                    });
                    return;
                }
                set.add(HRAdminId);
                tenant.HRUserID = Array.from(set);
                tenant.updatedAt = new Date().toISOString()
                const updateRequest = tenantStore.put(tenant);
                updateRequest.onsuccess = () => {
                    resolve({
                        ok: true,
                        data: tenant,
                    });
                };
                updateRequest.onerror = () => {
                    reject({
                        ok: false,
                        data: updateRequest.error,
                    });
                };
            };
            request.onerror = () => {
                reject({
                    ok: false,
                    data: request.error,
                });
            };
        })
    }

    RemoveHRFromTenant(tenantId, HRAdminId) {
        return new Promise((resolve, reject) => {
            const tenantStore = this.db.tx("tenants", "readwrite");
            const request = tenantStore.get(tenantId);
            request.onsuccess = (event) => {
                const tenant = event.target.result;
                const set = new Set(tenant.HRUserID);
                if (!set.has(HRAdminId)) {
                    reject({
                        ok: false,
                        data: "HR Admin ID not found",
                    });
                    return;
                }
                set.delete(HRAdminId);
                tenant.HRUserID = Array.from(set);
                tenant.updatedAt = new Date().toISOString()
                const updateRequest = tenantStore.put(tenant);
                updateRequest.onsuccess = () => {
                    resolve({
                        ok: true,
                        data: tenant,
                    });
                };
                updateRequest.onerror = () => {
                    reject({
                        ok: false,
                        data: updateRequest.error,
                    });
                };
            };
            request.onerror = () => {
                reject({
                    ok: false,
                    data: request.error,
                });
            };
        })
    }




    GetTenantById(id) {
        return new Promise((resolve, reject) => {
            const tenantStore = this.db.tx("tenants");
            const request = tenantStore.get(id);
            request.onsuccess = (event) => {
                const tenant = event.target.result;
                resolve({
                    ok: true,
                    data: tenant,
                });
            };
            request.onerror = () => {
                reject({
                    ok: false,
                    data: request.error,
                });
            };
        })
    }

    GetAllTenants() {
        return new Promise((resolve, reject) => {
            const tenantStore = this.db.tx("tenants");
            const request = tenantStore.getAll();
            request.onsuccess = (event) => {
                const tenants = event.target.result;
                resolve({
                    ok: true,
                    data: tenants,
                });
            };
            request.onerror = () => {
                reject({
                    ok: false,
                    data: request.error,
                });
            };
        })
    }

    DeleteTenant(id) {
        return new Promise((resolve, reject) => {
            const tenantStore = this.db.tx("tenants", "readwrite");
            const request = tenantStore.delete(id);
            request.onsuccess = () => {
                resolve({
                    ok: true,
                    data: id,
                });
            };
            request.onerror = () => {
                reject({
                    ok: false,
                    data: request.error,
                });
            };
        })
    }


}



export default TenantsRepo;
