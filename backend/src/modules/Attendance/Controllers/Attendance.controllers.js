import AttendanceModel from "../Models/attendance.model.js";
import { ApiResponse, ApiError, AsyncHandler, GenerateUploadUrl } from "../../../utils/index.js";
import Types from "../../../types/index.js";
import RedisClient from "../../../config/Redis.js";
import { Cfg } from "../../../config/env.js";
class AttendanceController {
    constructor() {
        this.repo = AttendanceModel;
    }

    Create = AsyncHandler(async (req, res) => {
        const parsedData = Types.Attendance.Create.safeParse(req.body);
        if (!parsedData.success) {
            throw new ApiError(Types.Errors.UnprocessableData, "Please provide valid data", parsedData.error.errors);
        }

        const { userId, type, photo } = parsedData.data;
        
        console.log("Attendance punch data", { userId, type, photo });
        // HR users cannot punch in/out
        if (req.user.role === "HR") {
            throw new ApiError(Types.Errors.Forbidden, "HR users cannot punch in/out");
        }

        // Verify employees are marking attendance for themselves only
        if (req.user.id !== userId) {
            throw new ApiError(Types.Errors.Forbidden, "You can only mark attendance for yourself");
        }

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setUTCHours(0, 0, 0, 0);

        let attendance = await this.repo.findOne({ user: userId, date: startOfDay });

        if (!attendance) {
            // First punch needs to be IN
            if (type !== 'IN') {
                throw new ApiError(Types.Errors.BadRequest, "First punch of the day must be IN");
            }
            attendance = new this.repo({
                user: userId,
                date: startOfDay,
                punches: [{ type, time: now, photo: photo || null }]
            });
            await attendance.save();
            return res.status(201).json(new ApiResponse(201, attendance, `Punched ${type} successfully`));
        }

        // If attendance exists, check last punch
        const lastPunch = attendance.punches[attendance.punches.length - 1];

        if (lastPunch && lastPunch.type === type) {
            throw new ApiError(Types.Errors.BadRequest, `Cannot punch ${type} again without punching ${type === 'IN' ? 'OUT' : 'IN'}`);
        }

        // Require photo for OUT punches
        if (type === 'OUT' && !photo) {
            throw new ApiError(Types.Errors.BadRequest, "Photo is required when punching OUT");
        }

        attendance.punches.push({ type, time: now, photo: photo || null });
        await attendance.save();

        return res.status(200).json(new ApiResponse(200, attendance, `Punched ${type} successfully`));
    });

    Get = AsyncHandler(async (req, res) => {
        const query = {};

        if (req.user.role !== "HR") {
            query.user = req.user.id;
        } else if (req.query.userId) {
            query.user = req.query.userId;
        }

        if (req.query.startDate && req.query.endDate) {
            query.date = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        } else if (req.query.date) {
            const queryDate = new Date(req.query.date);
            queryDate.setUTCHours(0, 0, 0, 0);
            query.date = queryDate;
        }

        const { page: pageQuery, limit: limitQuery } = req.query;
        let limit = parseInt(limitQuery) || 10;
        let page = parseInt(pageQuery) || 1;
        if (limit > 100) limit = 100;

        const populateOptions = {
            path: "user",
            select: "firstName lastName email deptId",
            populate: {
                path: "deptId",
                select: "name"
            }
        };

        let queryOptions = this.repo.find(query).populate(populateOptions).sort({ date: -1 });

        // Disable pagination if limit=all is requested for Analytics
        if (limitQuery !== 'all') {
            const skip = (page - 1) * limit;
            queryOptions = queryOptions.skip(skip).limit(limit);
        }

        const attendances = await queryOptions;
        const total = await this.repo.countDocuments(query);

        return res.status(200).json(new ApiResponse(200, { data: attendances, total, page, limit: limitQuery === 'all' ? total : limit }, "Attendances fetched successfully"));
    });

    GetPunchPhotoSignedUrl = AsyncHandler(async (req, res) => {
        const { fileName, contentType } = req.query;
        if (!fileName || !contentType) {
            throw new ApiError(Types.Errors.BadRequest, "fileName and contentType are required");
        }
        const signedUrl = await GenerateUploadUrl(fileName, contentType, "punch-photos");
        return res.status(200).json(new ApiResponse(200, { signedUrl }, "Signed URL generated successfully"));
    });

    StatusOfAttendance = AsyncHandler(async (req, res) => {
        const { photoUrl } = req.query;

        if (!photoUrl) {
            throw new ApiError(Types.Errors.BadRequest, "photoUrl query parameter is required");
        }

        const redisInstance = RedisClient.GetInstance(Cfg.REDIS_URL);
        const client = redisInstance.GetClient();

        const MAX_WAIT_MS = 60_000; // 1 minute max wait
        const POLL_INTERVAL_MS = 2_000; // check every 2 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < MAX_WAIT_MS) {
            const result = await client.get(photoUrl);

            if (result !== null) {
                const parsed = JSON.parse(result);

                if (parsed.match === true) {
                    return res.status(200).json(
                        new ApiResponse(200, { status: "verified", match: true }, "Face verified successfully")
                    );
                } else {
                    return res.status(200).json(
                        new ApiResponse(200, { status: "failed", match: false }, "Please use your own photo")
                    );
                }
            }

            // Wait before polling again
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
        }

        // Timed out — no result from worker within 1 minute
        return res.status(200).json(
            new ApiResponse(200, { status: "timeout", match: null }, "Please upload your selfie again")
        );
    });
}

export default AttendanceController;