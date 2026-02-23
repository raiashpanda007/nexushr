import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";
import AttendanceModel from "../../Attendance/Models/attendance.model.js";

class SyncController {

    Handler = AsyncHandler(async (req, res) => {
        const parsedBody = Types.OfflineQueue.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(
                Types.Errors.UnprocessableData,
                "Invalid data to sync",
                parsedBody.error.errors
            );
        }

        const userId = req.user.id;
        const punches = parsedBody.data; // [{ id, type, createdAt }]

        if (punches.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, null, "Nothing to sync")
            );
        }

        // Group punches by calendar day (UTC midnight)
        const byDay = new Map();

        for (const punch of punches) {
            const punchTime = new Date(punch.createdAt);
            const dayKey = new Date(punchTime);
            dayKey.setUTCHours(0, 0, 0, 0);
            const key = dayKey.toISOString();

            if (!byDay.has(key)) {
                byDay.set(key, { date: dayKey, punches: [] });
            }

            const group = byDay.get(key);
            const last = group.punches[group.punches.length - 1];
            if (!last || last.type !== punch.type) {
                group.punches.push({ type: punch.type, time: punchTime });
            }
        }


        const bulkOps = [];

        for (const { date, punches: dayPunches } of byDay.values()) {

            bulkOps.push({
                updateOne: {
                    filter: { user: userId, date },
                    update: {
                        $push: {
                            punches: { $each: dayPunches }
                        }
                    },
                    upsert: true,
                }
            });
        }

        await AttendanceModel.bulkWrite(bulkOps, { ordered: false });

        // Recalculate totalMinutes for affected days
        const affectedDates = [...byDay.values()].map(g => g.date);
        const affected = await AttendanceModel.find({
            user: userId,
            date: { $in: affectedDates }
        });

        const recalcOps = affected.map(doc => {
            const sorted = [...doc.punches].sort(
                (a, b) => new Date(a.time) - new Date(b.time)
            );
            const firstIn = sorted.find(p => p.type === "IN");
            const lastOut = [...sorted].reverse().find(p => p.type === "OUT");
            const totalMinutes = (firstIn && lastOut)
                ? Math.max(0, Math.floor(
                    (new Date(lastOut.time) - new Date(firstIn.time)) / 60000
                ))
                : 0;

            return {
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: { totalMinutes } }
                }
            };
        });

        if (recalcOps.length > 0) {
            await AttendanceModel.bulkWrite(recalcOps, { ordered: false });
        }

        return res.status(200).json(
            new ApiResponse(200, { synced: punches.length }, "Offline punches synced successfully")
        );
    });
}

export default SyncController;