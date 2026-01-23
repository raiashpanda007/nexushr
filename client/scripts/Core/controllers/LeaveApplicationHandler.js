import { syncQueueHandler } from "../startup.js";
class LeaveApplicationHandler {
    constructor(db, repo, userState) {
        this.db = db;
        this.repo = repo;
        this.user = userState;
    }
    async applyLeave(leaveType, startDate, endDate, reason, userId) {
         
        const startSync = await syncQueueHandler.AddItemToQueue("leaveApplications", "create", {
            leaveType, 
            startDate,
            endDate,
            reason,
            userId
        });
        console.log("Start Sync Response: ", startSync);
        if (!startSync.ok) {
            return {
                ok: false,
                data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + startSync.data
            }
        }
        const res = await this.repo.CreateLeaveApplication(leaveType, startDate, endDate, reason, userId);
        return res;
    }

    async fetchAllLeaveApplications() {
        return await this.repo.GetAllLeaveApplications();
    }

    async fetchLeavesOfUser(userId) {
        return await this.repo.GetAllLeavesOfSingleUser(userId);
    }   
    async AccpetLeaveApplication(leaveAppId) {
        if (this.user.data.user.role !== "HR") return {ok:false, data:"Unauthorized Access"};
        const sync = await syncQueueHandler.AddItemToQueue("leaveApplications", "updateStatus", {
            leaveAppId,
            status: "Accepted"
        });
        console.log("Sync Queue Response: ", sync);
        if (!sync.ok) {
            return {
                ok: false,
                data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
            }
        }
        const res = await this.repo.UpdateLeaveApplicationStatus(leaveAppId, "Accepted");
        return res;
    }

    async RejectLeaveApplication(leaveAppId) {
            const sync = await syncQueueHandler.AddItemToQueue("leaveApplications", "updateStatus", {
            leaveAppId,
            status: "Rejected"
        });
        console.log("Sync Queue Response: ", sync);
        if (!sync.ok) {
            return {
                ok: false,
                data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + sync.data
            }
        }
        if (this.user.data.user.role !== "HR") return {ok:false, data:"Unauthorized Access"};
        const res = await this.repo.UpdateLeaveApplicationStatus(leaveAppId, "Rejected");
        return res;
    }
    async FetchLeavesByStatus(status) {
        if (this.user.data.user.role !== "HR") return {ok:false, data:"Unauthorized Access"};
        const res = await this.repo.GetLeaveApplicationsByStatus(status);
        return res;
    }

    async GetOwnLeave() {
        const userId = this.user.data.user.id;
        const res = await this.repo.GetAllLeavesOfSingleUser(userId);
        return res;
    }
}

export default LeaveApplicationHandler;
