import LeaveRequestModel from "../Models/leaveRequests.model.js";
import LeaveBalanceModel from "../../LeavesBalances/Models/leavesBalances.model.js";
import UserModel from "../../../Users/models/users.models.js";
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
            const { page: pageQuery, limit: limitQuery, userId } = req.query;
            let limit = parseInt(limitQuery) || 10;
            let page = parseInt(pageQuery) || 1;
            if (limit > 100) limit = 100;
            const skip = (page - 1) * limit;

            if (req.user.role === "HR") {
                const filter = {};
                if (userId) {
                    if (!mongoose.Types.ObjectId.isValid(userId)) {
                        throw new ApiError(Types.Errors.BadRequest, "Invalid userId");
                    }
                    filter.requestedBy = new mongoose.Types.ObjectId(userId);
                }

                let queryOptions = this.repo.find(filter).populate("requestedBy").populate("respondedBy").populate("type").sort({ createdAt: -1 });
                if (limitQuery !== 'all') queryOptions = queryOptions.skip(skip).limit(limit);

                const leaveRequests = await queryOptions;
                const total = await this.repo.countDocuments(filter);

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

    Count = AsyncHandler(async (req, res) => {
        const baseFilter = req.user?.role === "HR" ? {} : { requestedBy: req.user.id };

        const [pendingCount, acceptedCount, rejectedCount] = await Promise.all([
            this.repo.countDocuments({ ...baseFilter, status: "PENDING" }),
            this.repo.countDocuments({ ...baseFilter, status: "ACCEPTED" }),
            this.repo.countDocuments({ ...baseFilter, status: "REJECTED" }),
        ]);
        return res.status(200).json(new ApiResponse(200, { pendingCount, acceptedCount, rejectedCount }, "Dashboard stats fetched successfully"));
    })

    DepartmentStats = AsyncHandler(async (req, res) => {
        if (req.user.role !== "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can access this");
        }

        const { departmentId } = req.params;
        const { status } = req.query;

        if (status && !["PENDING", "ACCEPTED", "REJECTED"].includes(String(status))) {
            throw new ApiError(Types.Errors.BadRequest, "Invalid status");
        }

        const matchStage = {};
        if (status) matchStage.status = String(status);

        if (!departmentId) {
            const summaryPipeline = [
                { $match: matchStage },

                {
                    $lookup: {
                        from: "users",
                        localField: "requestedBy",
                        foreignField: "_id",
                        as: "requestedBy"
                    }
                },
                { $unwind: "$requestedBy" },

                {
                    $lookup: {
                        from: "leavetypes",
                        localField: "type",
                        foreignField: "_id",
                        as: "type"
                    }
                },
                { $unwind: "$type" },

                {
                    $group: {
                        _id: {
                            deptId: "$requestedBy.deptId",
                            type: "$type.name"
                        },
                        count: { $sum: 1 }
                    }
                },

                {
                    $group: {
                        _id: "$_id.deptId",
                        totalLeaves: { $sum: "$count" },
                        leaveTypes: {
                            $push: {
                                type: "$_id.type",
                                count: "$count"
                            }
                        }
                    }
                },

                {
                    $lookup: {
                        from: "departments",
                        localField: "_id",
                        foreignField: "_id",
                        as: "department"
                    }
                },
                { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },

                {
                    $project: {
                        _id: 0,
                        departmentId: { $ifNull: ["$_id", "unassigned"] },
                        department: { $ifNull: ["$department.name", "Unassigned"] },
                        totalLeaves: 1,
                        leaveTypes: 1
                    }
                },
                { $sort: { totalLeaves: -1 } }
            ];

            const stats = await LeaveRequestModel.aggregate(summaryPipeline);

            return res.status(200).json(
                new ApiResponse(200, stats, "Department summary fetched")
            );
        }

        // =====================================================
        // 📋 DEPARTMENT VIEW — HISTORY + TYPE BREAKDOWN
        // =====================================================

        let departmentMatch = {};
        if (departmentId === "unassigned") {
            departmentMatch = {
                $or: [
                    { "requestedBy.deptId": { $exists: false } },
                    { "requestedBy.deptId": null }
                ]
            };
        } else {
            if (!mongoose.Types.ObjectId.isValid(departmentId)) {
                throw new ApiError(Types.Errors.BadRequest, "Invalid department id");
            }
            departmentMatch = { "requestedBy.deptId": new mongoose.Types.ObjectId(departmentId) };
        }

        const detailedPipeline = [
            { $match: matchStage },

            {
                $lookup: {
                    from: "users",
                    localField: "requestedBy",
                    foreignField: "_id",
                    as: "requestedBy",
                },
            },
            { $unwind: "$requestedBy" },

            { $match: departmentMatch },

            {
                $lookup: {
                    from: "leavetypes",
                    localField: "type",
                    foreignField: "_id",
                    as: "type",
                },
            },
            { $unwind: "$type" },

            {
                $facet: {
                    history: [
                        {
                            $project: {
                                _id: 0,
                                user: {
                                    firstName: "$requestedBy.firstName",
                                    lastName: "$requestedBy.lastName",
                                    email: "$requestedBy.email",
                                },
                                leaveType: "$type.name",
                                leaveCode: "$type.code",
                                from: 1,
                                to: 1,
                                quantity: 1,
                                status: 1,
                                appliedAt: "$createdAt",
                            },
                        },
                        { $sort: { from: -1 } },
                    ],

                    userSummary: [
                        {
                            $group: {
                                _id: {
                                    userId: "$requestedBy._id",
                                    type: "$type.name",
                                },
                                firstName: { $first: "$requestedBy.firstName" },
                                lastName: { $first: "$requestedBy.lastName" },
                                email: { $first: "$requestedBy.email" },
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $group: {
                                _id: "$_id.userId",
                                firstName: { $first: "$firstName" },
                                lastName: { $first: "$lastName" },
                                email: { $first: "$email" },
                                totalLeaves: { $sum: "$count" },
                                leaveTypes: {
                                    $push: {
                                        type: "$_id.type",
                                        count: "$count",
                                    },
                                },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                userId: "$_id",
                                firstName: 1,
                                lastName: 1,
                                email: 1,
                                totalLeaves: 1,
                                leaveTypes: 1,
                            },
                        },
                        { $sort: { totalLeaves: -1 } },
                    ],

                    leaveTypeSummary: [
                        {
                            $group: {
                                _id: "$type.name",
                                count: { $sum: 1 },
                            },
                        },
                        {
                            $project: {
                                _id: 0,
                                type: "$_id",
                                count: 1,
                            },
                        },
                    ],
                },
            },
        ];

        const [details] = await LeaveRequestModel.aggregate(detailedPipeline);

        const history = Array.isArray(details?.history) ? details.history : [];
        const leaveTypeSummary = Array.isArray(details?.leaveTypeSummary) ? details.leaveTypeSummary : [];
        const userSummaryFromRequests = Array.isArray(details?.userSummary) ? details.userSummary : [];

        const userSummaryById = new Map(
            userSummaryFromRequests
                .filter((u) => u && u.userId)
                .map((u) => [String(u.userId), u])
        );

        const userFilter = departmentId === "unassigned"
            ? {
                role: "EMPLOYEE",
                $or: [
                    { deptId: { $exists: false } },
                    { deptId: null }
                ]
            }
            : {
                role: "EMPLOYEE",
                deptId: new mongoose.Types.ObjectId(departmentId)
            };

        const employees = await UserModel.find(userFilter)
            .select("_id firstName lastName email")
            .lean();

        const employeeIdSet = new Set(employees.map((e) => String(e._id)));

        const expandedUserSummary = employees.map((emp) => {
            const existing = userSummaryById.get(String(emp._id));
            return {
                userId: String(emp._id),
                firstName: String(existing?.firstName ?? emp.firstName ?? ""),
                lastName: String(existing?.lastName ?? emp.lastName ?? ""),
                email: String(existing?.email ?? emp.email ?? ""),
                totalLeaves: Number(existing?.totalLeaves ?? 0),
                leaveTypes: Array.isArray(existing?.leaveTypes) ? existing.leaveTypes : [],
            };
        });

        // Keep any users present in requests even if they aren't in the employee list
        for (const summary of userSummaryFromRequests) {
            const id = String(summary?.userId ?? "");
            if (!id || employeeIdSet.has(id)) continue;
            expandedUserSummary.push({
                userId: id,
                firstName: String(summary?.firstName ?? ""),
                lastName: String(summary?.lastName ?? ""),
                email: String(summary?.email ?? ""),
                totalLeaves: Number(summary?.totalLeaves ?? 0),
                leaveTypes: Array.isArray(summary?.leaveTypes) ? summary.leaveTypes : [],
            });
        }

        expandedUserSummary.sort((a, b) => {
            if (b.totalLeaves !== a.totalLeaves) return b.totalLeaves - a.totalLeaves;
            const aName = `${a.firstName} ${a.lastName}`.trim().toLowerCase();
            const bName = `${b.firstName} ${b.lastName}`.trim().toLowerCase();
            return aName.localeCompare(bName);
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    history,
                    userSummary: expandedUserSummary,
                    leaveTypeSummary,
                },
                "Department leave analytics fetched"
            )
        );
    });
}


export default LeaveRequestController;