import LeaveRequestModel from "../Models/leaveRequests.model.js";
import LeaveBalanceModel from "../../LeavesBalances/Models/leavesBalances.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../../utils/index.js"
import Types from "../../../../types/index.js";
import mongoose from "mongoose";


class LeaveRequestController {
    constructor() {
        this.repo = LeaveRequestModel;
    }

    Create = AsyncHandler(async (req, res) => {
        const parsedBody = Types.LeaveRequests.Create.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.UnprocessableData, "Invalid data", parsedBody.error);
        }
        const { type, quantity, from, to } = parsedBody.data;

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const leaveBalance = await LeaveBalanceModel.findOne({ user: req.user.id }).session(session);
            if (!leaveBalance) {
                throw new ApiError(Types.Errors.Forbidden, "No leave balance found for this user");
            }

            const typeBalance = leaveBalance.leaves.find(l => String(l.type) === String(type));
            if (!typeBalance || typeBalance.amount < quantity) {
                throw new ApiError(Types.Errors.Forbidden, `Insufficient leave balance. You only have ${typeBalance?.amount || 0} days remaining.`);
            }

            typeBalance.amount -= quantity;
            await leaveBalance.save({ session });

            const leaveRequest = new this.repo({ requestedBy: req.user.id, type, quantity, from, to });
            await leaveRequest.save({ session });

            await session.commitTransaction();
            session.endSession();

            return res.status(201).json(new ApiResponse(201, leaveRequest, "Leave request created successfully"));
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    })


    Delete = AsyncHandler(async (req, res) => {
        const uid = req.params.uid;
        if (!uid) {
            throw new ApiError(Types.Errors.BadRequest, "Leave request id is required");
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let leaveRequest;
            if (req.user.role === "HR") {
                leaveRequest = await this.repo.findByIdAndDelete(uid, { session });
            } else {
                leaveRequest = await this.repo.findOneAndDelete({ _id: uid, requestedBy: req.user.id }, { session });
            }

            if (!leaveRequest) {
                throw new ApiError(Types.Errors.NotFound, "Leave request not found");
            }

            if (leaveRequest.status === "PENDING") {
                const leaveBalance = await LeaveBalanceModel.findOne({ user: leaveRequest.requestedBy }).session(session);
                if (leaveBalance) {
                    const typeBalance = leaveBalance.leaves.find(l => String(l.type) === String(leaveRequest.type));
                    if (typeBalance) {
                        typeBalance.amount += leaveRequest.quantity;
                        await leaveBalance.save({ session });
                    }
                }
            }

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request deleted successfully"));
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    })

    Get = AsyncHandler(async (req, res) => {
        const uid = req.params.uid;
        if (!uid) {
            const { page: pageQuery, limit: limitQuery } = req.query;
            let limit = parseInt(limitQuery) || 10;
            let page = parseInt(pageQuery) || 1;
            if (limit > 100) limit = 100;
            const skip = (page - 1) * limit;

            if (req.user.role === "HR") {
                let queryOptions = this.repo.find().populate("requestedBy").populate("respondedBy").populate("type").sort({ createdAt: -1 });
                if (limitQuery !== 'all') queryOptions = queryOptions.skip(skip).limit(limit);

                const leaveRequests = await queryOptions;
                const total = await this.repo.countDocuments();

                return res.status(200).json(new ApiResponse(200, { data: leaveRequests, total, page, limit: limitQuery === 'all' ? total : limit }, "Leave requests fetched successfully"));
            } else {
                let queryOptions = this.repo.find({ requestedBy: req.user.id }).populate("requestedBy").populate("respondedBy").populate("type").sort({ createdAt: -1 });
                if (limitQuery !== 'all') queryOptions = queryOptions.skip(skip).limit(limit);

                const leaveRequests = await queryOptions;
                const total = await this.repo.countDocuments({ requestedBy: req.user.id });

                return res.status(200).json(new ApiResponse(200, { data: leaveRequests, total, page, limit: limitQuery === 'all' ? total : limit }, "Leave requests fetched successfully"));
            }
        } else {
            if (req.user.role != "HR") {
                const leaveRequest = await this.repo.findOne({ _id: uid, requestedBy: req.user.id }).populate("requestedBy").populate("respondedBy").populate("type");
                if (!leaveRequest) {
                    throw new ApiError(Types.Errors.NotFound, "Leave request not found");
                }
                return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request fetched successfully"));
            } else {
                const leaveRequest = await this.repo.findById(uid).populate("requestedBy").populate("respondedBy").populate("type");
                if (!leaveRequest) {
                    throw new ApiError(Types.Errors.NotFound, "Leave request not found");
                }
                return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request fetched successfully"));
            }
        }
    })

    ResponseLeaveRequest = AsyncHandler(async (req, res) => {
        const uid = req.params.uid;
        if (!uid) {
            throw new ApiError(Types.Errors.BadRequest, "Leave request id is required");
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const leaveRequest = await this.repo.findById(uid).session(session);
            if (!leaveRequest) {
                throw new ApiError(Types.Errors.NotFound, "Leave request not found");
            }

            // If it was already responded to, return error to avoid double-deduct/refund
            if (leaveRequest.status !== "PENDING") {
                throw new ApiError(Types.Errors.BadRequest, "Leave request has already been responded to");
            }

            leaveRequest.respondedBy = req.user.id;
            leaveRequest.status = req.body.status;
            await leaveRequest.save({ session });

            // If rejected, refund the leave balance
            if (req.body.status === "REJECTED") {
                const leaveBalance = await LeaveBalanceModel.findOne({ user: leaveRequest.requestedBy }).session(session);
                if (leaveBalance) {
                    const typeBalance = leaveBalance.leaves.find(l => String(l.type) === String(leaveRequest.type));
                    if (typeBalance) {
                        typeBalance.amount += leaveRequest.quantity;
                        await leaveBalance.save({ session });
                    }
                }
            }

            await session.commitTransaction();
            session.endSession();

            return res.status(200).json(new ApiResponse(200, leaveRequest, "Leave request response updated successfully"));
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }
    })


}


export default LeaveRequestController;