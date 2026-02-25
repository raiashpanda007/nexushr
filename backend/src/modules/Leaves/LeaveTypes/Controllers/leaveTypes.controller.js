import LeaveTypeModal from "../Models/leavetypes.model.js"
import { AsyncHandler, ApiResponse, ApiError } from "../../../../utils/index.js"
import Types from "../../../../types/index.js"

class LeaveTypeController {
    constructor() {
        this.repo = LeaveTypeModal
    }


    Create = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can create leave types")
        }
        const parsedBody = Types.LeaveTypes.Create.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.UnprocessableData, "Invalid data")
        }
        const { name, code, length, isPaid } = parsedBody.data
        const leaveType = await this.repo.create({ name, code, length, isPaid })
        return res.status(201).json(new ApiResponse(201, leaveType, "Leave type created successfully"))
    })

    Update = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can update leave types")
        }
        const id = req.params.id
        if (!id) {
            throw new ApiError(Types.Errors.BadRequest, "Leave type id is required")
        }
        const parsedBody = Types.LeaveTypes.Update.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.UnprocessableData, "Invalid data")
        }
        const { name, code, length, isPaid } = parsedBody.data
        const leaveType = await this.repo.findByIdAndUpdate(id, { name, code, length, isPaid }, { new: true })
        if (!leaveType) {
            throw new ApiError(Types.Errors.NotFound, "Leave type not found")
        }
        return res.status(200).json(new ApiResponse(200, leaveType, "Leave type updated successfully"))
    })

    Delete = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can delete leave types")
        }
        const id = req.params.id
        if (!id) {
            throw new ApiError(Types.Errors.BadRequest, "Leave type id is required")
        }
        const leaveType = await this.repo.findByIdAndDelete(id)
        if (!leaveType) {
            throw new ApiError(Types.Errors.NotFound, "Leave type not found")
        }
        return res.status(200).json(new ApiResponse(200, leaveType, "Leave type deleted successfully"))

    })

    Get = AsyncHandler(async (req, res) => {
        const id = req.params.id
        if (id) {
            const leaveType = await this.repo.findById(id)
            if (!leaveType) {
                throw new ApiError(Types.Errors.NotFound, "Leave type not found")
            }
            return res.status(200).json(new ApiResponse(200, leaveType, "Leave type fetched successfully"))
        }

        const { page: pageQuery, limit: limitQuery, isPaid } = req.query;
        let limit = parseInt(limitQuery) || 10;
        let page = parseInt(pageQuery) || 1;
        if (limit > 100) limit = 100;

        const skip = (page - 1) * limit;
        const query = {};
        if (isPaid !== undefined) {
            query.isPaid = isPaid;
        }

        let queryOptions = this.repo.find(query).sort({ _id: -1 });
        if (limitQuery !== 'all') {
            queryOptions = queryOptions.skip(skip).limit(limit);
        }

        const leaveTypes = await queryOptions;
        const total = await this.repo.countDocuments(query);

        return res.status(200).json(new ApiResponse(200, { data: leaveTypes, total, page, limit: limitQuery === 'all' ? total : limit }, "Leave types fetched successfully"));
    })




}



export default LeaveTypeController