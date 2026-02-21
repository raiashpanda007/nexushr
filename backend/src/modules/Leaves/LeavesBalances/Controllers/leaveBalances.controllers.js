import { AsyncHandler, ApiResponse, ApiError } from "../../../../utils/index.js"
import mongoose from "mongoose"
import LeaveBalanceModel from "../Models/leavesBalances.model.js"
import Types from "../../../../types/index.js"

class LeaveBalanceController {

    constructor() {
        this.repo = LeaveBalanceModel
    }


    Create = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can create leave balances")
        }
        const parsedBody = Types.LeaveBalances.Create.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.UnprocessableData, "Invalid data")
        }
        const { user, leaves } = parsedBody.data
        const leaveBalance = await this.repo.create({ user, leaves })
        return res.status(201).json(new ApiResponse(201, leaveBalance, "Leave balance created successfully"))
    })

    Update = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can update leave balances")
        }
        const id = req.params.id
        if (!id) {
            throw new ApiError(Types.Errors.BadRequest, "Leave balance id is required")
        }
        const parsedBody = Types.LeaveBalances.Update.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.UnprocessableData, "Invalid data")
        }
        const { user, leaves } = parsedBody.data
        const leaveBalance = await this.repo.findByIdAndUpdate(id, { user, leaves }, { new: true })
        if (!leaveBalance) {
            throw new ApiError(Types.Errors.NotFound, "Leave balance not found")
        }
        return res.status(200).json(new ApiResponse(200, leaveBalance, "Leave balance updated successfully"))
    })

    UpdateSingleBalance = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can update leave balances")
        }
        const id = req.params.id
        const { leaveTypeId, balance } = req.body;

        if (!id || !leaveTypeId || balance === undefined) {
            throw new ApiError(Types.Errors.BadRequest, "Invalid data")
        }

        const leaveBalance = await this.repo.findOneAndUpdate(
            { _id: id, "leaves.type": leaveTypeId },
            { $set: { "leaves.$.amount": balance } },
            { new: true }
        );

        if (!leaveBalance) {
            throw new ApiError(Types.Errors.NotFound, "Leave balance or type not found")
        }
        return res.status(200).json(new ApiResponse(200, leaveBalance, "Leave balance updated successfully"))
    })

    Delete = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can delete leave balances")
        }
        const id = req.params.id
        if (!id) {
            throw new ApiError(Types.Errors.BadRequest, "Leave balance id is required")
        }
        const leaveBalance = await this.repo.findByIdAndDelete(id)
        if (!leaveBalance) {
            throw new ApiError(Types.Errors.NotFound, "Leave balance not found")
        }
        return res.status(200).json(new ApiResponse(200, leaveBalance, "Leave balance deleted successfully"))
    })

    Get = AsyncHandler(async (req, res) => {
        const id = req.params.id

        const pipeline = [
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            {
                $unwind: {
                    path: "$userDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "userDetails.deptId",
                    foreignField: "_id",
                    as: "userDetails.department"
                }
            },
            {
                $unwind: {
                    path: "$userDetails.department",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: "leavetypes",
                    localField: "leaves.type",
                    foreignField: "_id",
                    as: "mappedLeaveTypes"
                }
            },
            {
                $addFields: {
                    leaves: {
                        $map: {
                            input: "$leaves",
                            as: "leave",
                            in: {
                                $mergeObjects: [
                                    "$$leave",
                                    {
                                        typeDetails: {
                                            $arrayElemAt: [
                                                {
                                                    $filter: {
                                                        input: "$mappedLeaveTypes",
                                                        as: "type",
                                                        cond: { $eq: ["$$type._id", "$$leave.type"] }
                                                    }
                                                },
                                                0
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    mappedLeaveTypes: 0,
                    "userDetails.passwordHash": 0
                }
            }
        ]

        const { page: pageQuery, limit: limitQuery } = req.query;
        let limit = parseInt(limitQuery) || 10;
        let page = parseInt(pageQuery) || 1;
        if (limit > 100) limit = 100;

        const skip = (page - 1) * limit;

        if (id) {
            if (id != req.user.id) {
                if (req.user.role != "HR") {
                    throw new ApiError(Types.Errors.Forbidden, "Only HR can fetch leave balances")
                }
            }

            const leaveBalance = await this.repo.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(id) } },
                ...pipeline
            ])

            if (!leaveBalance || leaveBalance.length === 0) {
                throw new ApiError(Types.Errors.NotFound, "Leave balance not found")
            }
            return res.status(200).json(new ApiResponse(200, leaveBalance[0], "Leave balance fetched successfully"))
        }

        if (req.user.role != "HR") {
            // Employee: return only their own balance. Need pagination logic if ever multiple, but it's usually 1
            const matchPipeline = [{ $match: { user: new mongoose.Types.ObjectId(req.user.id) } }];
            let paginatedPipeline = [...matchPipeline, ...pipeline];
            if (limitQuery !== 'all') {
                paginatedPipeline = [...matchPipeline, { $skip: skip }, { $limit: limit }, ...pipeline];
            }

            const leaveBalances = await this.repo.aggregate(paginatedPipeline);
            const total = await this.repo.countDocuments({ user: req.user.id });
            return res.status(200).json(new ApiResponse(200, { data: leaveBalances, total, page, limit: limitQuery === 'all' ? total : limit }, "Leave balances fetched successfully"));
        }

        let paginatedPipeline = pipeline;
        if (limitQuery !== 'all') {
            paginatedPipeline = [{ $skip: skip }, { $limit: limit }, ...pipeline];
        }

        const leaveBalances = await this.repo.aggregate(paginatedPipeline)
        const total = await this.repo.countDocuments();
        return res.status(200).json(new ApiResponse(200, { data: leaveBalances, total, page, limit: limitQuery === 'all' ? total : limit }, "Leave balances fetched successfully"))
    })
}

export default LeaveBalanceController
