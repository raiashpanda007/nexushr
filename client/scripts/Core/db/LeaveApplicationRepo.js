class LeaveApplicationRepo {
    constructor(db) {
        this.db = db;
    }
    
    AddLeaveApplication(leaveType, startDate, endDate, reason, userId) {
        const id = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const store = this.db.tx("leaves_applications","readwrite")
            const request = store.add({
                id: id,
                leaveType: leaveType,
                startDate: startDate,
                endDate: endDate,
                reason: reason,
                userId: userId,
                status: "Pending",
                appliedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            request.onsuccess = () => {
                resolve({
                    ok:true,
                    data:request.result
                });   
            };
            request.onerror = () => {
                console.error("Error adding leave application:", request.error)
                reject({
                    ok:false,
                    data:request.error
                });
            };
        });
    }
    GetAllLeaveApplications() {
        return new Promise((resolve, reject) => {
            const store = this.db.tx("leaves_applications")
            const request = store.getAll();
            request.onsuccess = () => {
                resolve({
                    ok:true,
                    data:request.result
                });   
            };
            request.onerror = () => {
                console.error("Error fetching leave applications:", request.error)
                reject({
                    ok:false,
                    data:request.error
                });
            };
        });
    }

    GetAllLeavesOfSingleUser(userId) {
        return new Promise((resolve, reject) => {
            const store = this.db.tx("leaves_applications")
            
            const index = store.index("userID_index");
            const request = index.getAll(IDBKeyRange.only(userId));
            request.onsuccess = () => {
                resolve({
                    ok:true,
                    data:request.result
                });   
            };
            request.onerror = () => {
                console.error("Error fetching leave applications for user:", request.error)
                reject({
                    ok:false,
                    data:request.error
                });
            };
        });
    }
    AcceptLeaveApplication(leaveAppId) {
        return new Promise((resolve, reject) => {
            const store = this.db.tx("leaves_applications","readwrite");
            const getRequest = store.get(leaveAppId);
            getRequest.onsuccess = () => {
                const leaveApp = getRequest.result;
                leaveApp.status = "Accepted";
                leaveApp.updatedAt = new Date().toISOString();
                const updateRequest = store.put(leaveApp);
                updateRequest.onsuccess = () => {
                    resolve({
                        ok:true,
                        data:updateRequest.result
                    });   
                };
                updateRequest.onerror = () => {
                    console.error("Error updating leave application:", updateRequest.error)
                    reject({
                        ok:false,
                        data:updateRequest.error
                    });
                };
            };
            getRequest.onerror = () => {
                console.error("Error fetching leave application:", getRequest.error)
                reject({
                    ok:false,
                    data:getRequest.error
                });
            };
        });
    }
    RejectLeaveApplication(leaveAppId) {
        return new Promise((resolve, reject) => {
            const store = this.db.tx("leaves_applications","readwrite");
            const getRequest = store.get(leaveAppId);
            getRequest.onsuccess = () => {
                const leaveApp = getRequest.result;
                leaveApp.status = "Rejected";
                leaveApp.updatedAt = new Date().toISOString();
                const updateRequest = store.put(leaveApp);      
                updateRequest.onsuccess = () => {
                    resolve({
                        ok:true,
                        data:updateRequest.result
                    });   
                };
                updateRequest.onerror = () => {
                    console.error("Error updating leave application:", updateRequest.error)
                    reject({
                        ok:false,
                        data:updateRequest.error
                    });
                };
            };
            getRequest.onerror = () => {
                console.error("Error fetching leave application:", getRequest.error)
                reject({
                    ok:false,
                    data:getRequest.error
                });
            };
        });
    }

    UpdateLeaveApplicationStatus(leaveAppId, status) {
        return new Promise((resolve, reject) => {
            const store = this.db.tx("leaves_applications","readwrite");
            const getRequest = store.get(leaveAppId);
            getRequest.onsuccess = () => {
                const leaveApp = getRequest.result;
                if (!leaveApp) {
                    reject({
                        ok: false,
                        data: "Leave application not found"
                    });
                    return;
                }
                leaveApp.status = status;
                leaveApp.updatedAt = new Date().toISOString();
                const updateRequest = store.put(leaveApp);
                updateRequest.onsuccess = () => {
                    resolve({
                        ok: true,
                        data: updateRequest.result
                    });
                };
                updateRequest.onerror = () => {
                    console.error("Error updating leave application:", updateRequest.error);
                    reject({
                        ok: false,
                        data: updateRequest.error
                    });
                };
            };
            getRequest.onerror = () => {
                console.error("Error fetching leave application:", getRequest.error);
                reject({
                    ok: false,
                    data: getRequest.error
                });
            };
        });
    }

    GetLeaveApplicationsByStatus(status) {
        return new Promise((resolve, reject) => {
            const store = this.db.tx("leaves_applications")
            const index = store.index("status_index");
            const request = index.getAll(IDBKeyRange.only(status));
            request.onsuccess = () => {
                resolve({
                    ok: true,
                    data: request.result
                });
            };
            request.onerror = () => {
                console.error("Error fetching leave applications by status:", request.error);
                reject({
                    ok: false,
                    data: request.error
                });
            };
        });
    }
    
}

export default LeaveApplicationRepo;