import LeaveRequestModel from "../Models/leaveRequests.model.js";
import LeaveBalanceModel from "../../LeavesBalances/Models/leavesBalances.model.js";
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

        // Check if employee has that leave type and enough balance
        const leaveBalance = await LeaveBalanceModel.findOne({ user: req.user.id });
        if (!leaveBalance) {
            return ApiError(Types.Errors.Forbidden, "No leave balance found for this user");
        }

        const typeBalance = leaveBalance.leaves.find(l => String(l.type) === String(type));
        if (!typeBalance || typeBalance.amount < quantity) {
            return ApiError(Types.Errors.Forbidden, `Insufficient leave balance. You only have ${typeBalance?.amount || 0} days remaining.`);
        }

        // Deduct balance to prevent overbooking (since status is pending, amount is held)
        typeBalance.amount -= quantity;
        await leaveBalance.save();

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

        if (leaveRequest.status === "PENDING") {
            const leaveBalance = await LeaveBalanceModel.findOne({ user: leaveRequest.requestedBy });
            if (leaveBalance) {
                const typeBalance = leaveBalance.leaves.find(l => String(l.type) === String(leaveRequest.type));
                if (typeBalance) {
                    typeBalance.amount += leaveRequest.quantity;
                    await leaveBalance.save();
                }
            }
        }

        return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request deleted successfully"));
    })

    Get = AsyncHandler(async (req, res) => {
        const id = req.params.id;
        if (!id) {
            if (req.user.role === "HR") {
                const leaveRequests = await this.repo.find().populate("requestedBy").populate("respondedBy").populate("type");
                return res.status(200).json(new ApiResponse(200, leaveRequests, "Leave requests fetched successfully"));
            } else {
                const leaveRequests = await this.repo.find({ requestedBy: req.user.id }).populate("requestedBy").populate("respondedBy").populate("type");
                return res.status(200).json(new ApiResponse(200, leaveRequests, "Leave requests fetched successfully"));
            }
        } else {
            if (req.user.role != "HR") {
                const leaveRequest = await this.repo.findById(id, { requestedBy: req.user.id }).populate("requestedBy").populate("respondedBy").populate("type");
                if (!leaveRequest) {
                    return ApiError(Types.Errors.NotFound, "Leave request not found");
                }
                return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request fetched successfully"));
            } else {
                const leaveRequest = await this.repo.findById(id).populate("requestedBy").populate("respondedBy").populate("type");
                if (!leaveRequest) {
                    return ApiError(Types.Errors.NotFound, "Leave request not found");
                }
                return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request fetched successfully"));
            }
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

        // If it was already responded to, return error to avoid double-deduct/refund
        if (leaveRequest.status !== "PENDING") {
            return ApiError(Types.Errors.BadRequest, "Leave request has already been responded to");
        }

        leaveRequest.respondedBy = req.user.id;
        leaveRequest.status = req.body.status;
        await leaveRequest.save();

        // If rejected, refund the leave balance
        if (req.body.status === "REJECTED") {
            const leaveBalance = await LeaveBalanceModel.findOne({ user: leaveRequest.requestedBy });
            if (leaveBalance) {
                const typeBalance = leaveBalance.leaves.find(l => String(l.type) === String(leaveRequest.type));
                if (typeBalance) {
                    typeBalance.amount += leaveRequest.quantity;
                    await leaveBalance.save();
                }
            }
        }

        return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request response updated successfully"));
    })


}


export default LeaveRequestController;