import { AsyncHandler, ApiResponse, ApiError, buildUserSnapshot, buildLeaveTypeSnapshot } from "../../../../utils/index.js"
import mongoose from "mongoose"
import LeaveBalanceModel from "../Models/leavesBalances.model.js"
import UserModel from "../../../Users/models/users.models.js"
import LeaveTypeModel from "../../LeaveTypes/Models/leavetypes.model.js"
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
        const [userDoc, leaveTypeDocs] = await Promise.all([
            UserModel.findById(user)
                .select("firstName lastName email profilePhoto deptSnapshot deptId")
                .lean(),
            LeaveTypeModel.find({ _id: { $in: leaves.map((l) => l.type) } })
                .select("name code length isPaid")
                .lean(),
        ]);

        const userSnapshot = buildUserSnapshot(userDoc);
        const leaveTypeMap = new Map(
            leaveTypeDocs.map((t) => [String(t._id), buildLeaveTypeSnapshot(t)])
        );

        const leavesWithSnapshots = leaves.map((l) => ({
            ...l,
            typeSnapshot: leaveTypeMap.get(String(l.type)) || null,
        }));

        const leaveBalance = await this.repo.create({
            user,
            userSnapshot,
            leaves: leavesWithSnapshots,
        })
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

        const updates = {};
        if (user) {
            const userDoc = await UserModel.findById(user)
                .select("firstName lastName email profilePhoto deptSnapshot deptId")
                .lean();
            updates.user = user;
            updates.userSnapshot = buildUserSnapshot(userDoc);
        }

        if (leaves) {
            const leaveTypeDocs = await LeaveTypeModel.find({ _id: { $in: leaves.map((l) => l.type) } })
                .select("name code length isPaid")
                .lean();
            const leaveTypeMap = new Map(
                leaveTypeDocs.map((t) => [String(t._id), buildLeaveTypeSnapshot(t)])
            );
            updates.leaves = leaves.map((l) => ({
                ...l,
                typeSnapshot: leaveTypeMap.get(String(l.type)) || null,
            }));
        }

        const leaveBalance = await this.repo.findByIdAndUpdate(id, updates, { new: true })
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

            const leaveBalance = await this.repo.findOne({ user: id }).lean()

            if (!leaveBalance) {
                throw new ApiError(Types.Errors.NotFound, "Leave balance not found")
            }
            return res.status(200).json(new ApiResponse(200, leaveBalance, "Leave balance fetched successfully"))
        }

        if (req.user.role != "HR") {
            // Employee: return only their own balance. Need pagination logic if ever multiple, but it's usually 1
            let queryOptions = this.repo.find({ user: req.user.id }).lean();
            if (limitQuery !== 'all') {
                queryOptions = queryOptions.skip(skip).limit(limit);
            }

            const leaveBalances = await queryOptions;
            const total = await this.repo.countDocuments({ user: req.user.id });
            return res.status(200).json(new ApiResponse(200, { data: leaveBalances, total, page, limit: limitQuery === 'all' ? total : limit }, "Leave balances fetched successfully"));
        }

        let queryOptions = this.repo.find().lean();
        if (limitQuery !== 'all') {
            queryOptions = queryOptions.skip(skip).limit(limit);
        }

        const leaveBalances = await queryOptions
        const total = await this.repo.countDocuments();
        return res.status(200).json(new ApiResponse(200, { data: leaveBalances, total, page, limit: limitQuery === 'all' ? total : limit }, "Leave balances fetched successfully"))
    })
}

export default LeaveBalanceController
