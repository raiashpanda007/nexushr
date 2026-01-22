class LeaveApplicationHandler {
    constructor(db, repo, userState) {
        this.db = db;
        this.repo = repo;
        this.user = userState;
    }
    async applyLeave(leaveType, startDate, endDate, reason, userId) {
        return await this.repo.AddLeaveApplication(leaveType, startDate, endDate, reason, userId);
    }

    async fetchAllLeaveApplications() {
        return await this.repo.GetAllLeaveApplications();
    }

    async fetchLeavesOfUser(userId) {
        return await this.repo.GetAllLeavesOfSingleUser(userId);
    }   
    async AccpetLeaveApplication(leaveAppId) {
        if (this.user.data.user.role !== "HR") return {ok:false, data:"Unauthorized Access"};
        const res = await this.repo.UpdateLeaveApplicationStatus(leaveAppId, "Accepted");
        return res;
    }

    async RejectLeaveApplication(leaveAppId) {
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
