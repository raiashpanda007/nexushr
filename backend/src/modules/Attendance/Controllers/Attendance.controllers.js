import AttendanceModel from "../Models/attendance.model.js";
import { ApiResponse, ApiError, AsyncHandler } from "../../../utils/index.js";
import Types from "../../../types/index.js";

class AttendanceController {
    constructor() {
        this.repo = AttendanceModel;
    }

    Create = AsyncHandler(async (req, res) => {
        const parsedData = Types.Attendance.Create.safeParse(req.body);
        if (!parsedData.success) {
            throw new ApiError(Types.Errors.UnprocessableData, "Please provide valid data", parsedData.error.errors);
        }

        const { userId, type } = parsedData.data;

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
                punches: [{ type, time: now }]
            });
            await attendance.save();
            return res.status(201).json(new ApiResponse(201, attendance, `Punched ${type} successfully`));
        }

        // If attendance exists, check last punch
        const lastPunch = attendance.punches[attendance.punches.length - 1];

        if (lastPunch && lastPunch.type === type) {
            throw new ApiError(Types.Errors.BadRequest, `Cannot punch ${type} again without punching ${type === 'IN' ? 'OUT' : 'IN'}`);
        }

        attendance.punches.push({ type, time: now });
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
}

export default AttendanceController;