import LeaveRequestModel from "../Models/leaveRequests.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../../utils/index.js"
import Types from "../../../../types/index.js";


class LeaveRequestController {
    constructor() {
        this.repo = LeaveRequestModel;
    }

    Create = AsyncHandler(async (req, res) => {
        const parsedBody = Types.LeaveRequests.Create.safeParse(req.body);
        if (!parsedBody.success) {
            return ApiError(Types.Errors.UnprocessableData, "Invalid data", parsedBody.error);
        }
        const { type, quantity, from, to } = parsedBody.data;
        const leaveRequest = await this.repo.create({ requestedBy: req.user.id, type, quantity, from, to });
        return res.status(201).json(new ApiResponse(201, leaveRequest, "Leave request created successfully"));
    })


    Delete = AsyncHandler(async (req, res) => {
        const id = req.params.id;
        if (!id) {
            return ApiError(Types.Errors.BadRequest, "Leave request id is required");
        }
        const leaveRequest = await this.repo.findByIdAndDelete(id, { requestedBy: req.user.id });
        if (!leaveRequest) {
            return ApiError(Types.Errors.NotFound, "Leave request not found");
        }
        return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request deleted successfully"));
    })

    Get = AsyncHandler(async (req, res) => {
        const id = req.params.id;
        if (!id) {
            if (req.user.role === "HR") {
                const leaveRequests = await this.repo.find().populate("requestedBy");
                return res.status(200).json(new ApiResponse(200, leaveRequests, "Leave requests fetched successfully"));
            } else {
                const leaveRequests = await this.repo.find({ requestedBy: req.user.id }).populate("requestedBy");
                return res.status(200).json(new ApiResponse(200, leaveRequests, "Leave requests fetched successfully"));
            }
        } else {
            const leaveRequest = await this.repo.findById(id, { requestedBy: req.user.id }).populate("requestedBy");
            if (!leaveRequest) {
                return ApiError(Types.Errors.NotFound, "Leave request not found");
            }
            return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request fetched successfully"));
        }
    })

    ResponseLeaveRequest = AsyncHandler(async (req, res) => {
        const id = req.params.id;
        if (!id) {
            return ApiError(Types.Errors.BadRequest, "Leave request id is required");
        }
        const leaveRequest = await this.repo.findById(id);
        if (!leaveRequest) {
            return ApiError(Types.Errors.NotFound, "Leave request not found");
        }
        leaveRequest.respondedBy = req.user.id;
        leaveRequest.status = req.body.status;
        await leaveRequest.save();
        return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request response updated successfully"));
    })


}


export default LeaveRequestController;