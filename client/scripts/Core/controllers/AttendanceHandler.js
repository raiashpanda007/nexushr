import { syncQueueHandler } from "../startup.js";
class AttendanceHandler {
    constructor(repo, authState) {
        this.repo = repo;
        this.authState = authState;
    }

    get user() {
        return this.authState.GetCurrUserState();
    }

    async Create(userID, type) {

        const userState = this.user;
        if ((!userState.ok || !userState.data) && type !== 'entry') {
            return { ok: false, data: "User not authenticated" };
        }

        try {
            const startSync = await syncQueueHandler.AddItemToQueue("attendance", "create", {
                userID,
                type
            });
            console.log("Start Sync Response: ", startSync);
            if (!startSync.ok) {
                return {
                    ok: false,
                    data: "Unable to store in sync queue try to get online cause offline sync queue to gayi: " + startSync.data
                }
            }
            const data = await this.repo.Create(userID, type);
            
            return { ok: true, data }
        } catch (error) {
            console.error("Create Attendance Controller :: ", error);
            return { ok: false, data: error.message || String(error) }
        }
    }

    async GetAttendance() {
        const userState = this.user;
        if (!userState.ok || !userState.data) return { ok: false, data: "User not authenticated" };
        console.log("User state :: ", userState.data.user.id);
        try {
            const data = await this.repo.GetAttendanceByUser(userState.data.user.id);
            console.log("Get attendance :: ", data);
            return { ok: data.ok, data: data.data }
        } catch (error) {
            console.error("Get Attendance Controller :: ", error);
            return { ok: false, data: error.message || String(error) }
        }
    }


}

export default AttendanceHandler;