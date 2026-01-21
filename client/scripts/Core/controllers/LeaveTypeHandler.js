class LeaveTypeHandler {
    constructor(repo, userState) {
        this.leaveTypeRepo = repo;
        this.user = userState;
    }
    async CreateLeaveType(code, name, length) {
        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "HR") return { ok: false, data: "Please login first" }
        if (!name || !code || !length) {
            return {
                ok: false,
                data: "Please provide every field"
            }
        }
        if (length === "full" || length === "half") {
            try {
                const { ok, data } = await this.leaveTypeRepo.Create(code, name, length);
                return {
                    ok,
                    data
                }
            } catch (e) {
                console.error("Error in creating new leave type  :: ", e);
                return {
                    ok: false,
                    data: e.data
                }
            }

        } else {
            return {
                ok: false,
                data: "Please provide a valid leave type length"
            }
        }


    }


    async GetAllLeaveTypes() {
        console.log("user in leave handler :: ", this.user);
        if (!this.user || !this.user.data || !this.user.data.user) return { ok: false, data: "Please login first" }
        try {
            const { ok, data } = await this.leaveTypeRepo.GetAllLeaveTypes();
            return {
                ok,
                data
            }
        } catch (e) {
            console.error("Error in getting all leave types :: ", e);
            return {
                ok: false,
                data: e.data
            }
        }
    }

    async EditLeaveType(id, code, name, length) {
        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "HR") return { ok: false, data: "Please login first" }
        if (!name || !code || !length) {
            return {
                ok: false,
                data: "Please provide every field"
            }
        }
        if (length === "full" || length === "half") {
            try {
                const { ok, data } = await this.leaveTypeRepo.EditLeaveType(id, code, name, length);
                return {
                    ok,
                    data
                }
            } catch (e) {
                console.error("Error in editing leave type  :: ", e);
                return {
                    ok: false,
                    data: e.data
                }
            }

        } else {
            return {
                ok: false,
                data: "Please provide a valid leave type length"
            }
        }
    }

    async DeleteLeaveType(id) {
        if (!this.user || !this.user.data || !this.user.data.user || this.user.data.user.role !== "HR") return { ok: false, data: "Please login first" }
        try {
            const { ok, data } = await this.leaveTypeRepo.DeleteLeaveType(id);
            return {
                ok,
                data
            }
        } catch (e) {
            console.error("Error in deleting leave type :: ", e);
            return {
                ok: false,
                data: e.data
            }
        }
    }
}
export default LeaveTypeHandler;