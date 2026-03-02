import mongoose from "mongoose";
import AssetModel from "../Models/assets.models.js";
import { AsyncHandler, ApiResponse, ApiError, GenerateUploadUrl } from "../../../utils/index.js";
import Types from "../../../types/index.js"
import AssetHistoryModel from "../Models/asset.history.model.js";
class AssetController {

    constructor() {
        this.repo = AssetModel;
        this.historyRepo = AssetHistoryModel;
    }

    Create = AsyncHandler(async (req, res) => {
        if (req.user.role !== "HR") {
            throw new ApiError(Types.Errors.Forbidden, "You are not authorized to create an asset");
        }
        const parsedData = Types.Assets.Create.safeParse(req.body);
        if (!parsedData.success) {
            throw new ApiError(Types.Errors.UnprocessableData, parsedData.error.errors[0].message);
        }
        const asset = await this.repo.create(parsedData.data);
        return res.status(201).json(new ApiResponse(201, asset, "Asset created successfully"));
    })

    Update = AsyncHandler(async (req, res) => {
        if (req.user.role !== "HR") {
            throw new ApiError(Types.Errors.Forbidden, "You are not authorized to update an asset");
        }
        const parsedData = Types.Assets.Update.safeParse(req.body);
        if (!parsedData.success) {
            throw new ApiError(Types.Errors.UnprocessableData, parsedData.error.errors[0].message);
        }

        const existingAsset = await this.repo.findById(req.params.id);
        if (!existingAsset) {
            throw new ApiError(Types.Errors.NotFound, "Asset not found");
        }

        const ownerChanged =
            parsedData.data.currentOwner &&
                existingAsset.currentOwner ? existingAsset.currentOwner.toString() : null !== parsedData.data.currentOwner;

        if (ownerChanged) {
            const session = await mongoose.startSession();
            try {
                session.startTransaction();

                const asset = await this.repo.findByIdAndUpdate(
                    req.params.id,
                    parsedData.data,
                    { new: true, session }
                );

                await this.historyRepo.create(
                    [{
                        assetId: asset._id,
                        userId: parsedData.data.currentOwner,
                        date: new Date(),
                        notes: `Ownership transferred from ${existingAsset.currentOwner ? existingAsset.currentOwner : "Company"} to ${parsedData.data.currentOwner ? parsedData.data.currentOwner : "Company"}`
                    }],
                    { session }
                );

                await session.commitTransaction();
                return res.status(200).json(new ApiResponse(200, asset, "Asset updated successfully"));
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        }

        const asset = await this.repo.findByIdAndUpdate(req.params.id, parsedData.data, { new: true });
        return res.status(200).json(new ApiResponse(200, asset, "Asset updated successfully"));
    })

    Delete = AsyncHandler(async (req, res) => {
        if (req.user.role !== "HR") {
            throw new ApiError(Types.Errors.Forbidden, "You are not authorized to delete an asset");
        }
        const asset = await this.repo.findByIdAndDelete(req.params.id);
        return res.status(200).json(new ApiResponse(200, asset, "Asset deleted successfully"));
    })

    Get = AsyncHandler(async (req, res) => {
        const id = req.params.id;
        if (id) {
            if (req.user.role !== "HR") {
                const asset = await this.repo.findOne({ _id: id, currentOwner: req.user.id });
                if (!asset) {
                    throw new ApiError(Types.Errors.Forbidden, "You are not authorized to access this asset");
                }
                return res.status(200).json(new ApiResponse(200, asset, "Asset fetched successfully"));
            }
            const assetHistory = await this.historyRepo.find({ assetId: id }).populate("userId", "name email");
            const asset = await this.repo.findById(id);
            return res.status(200).json(new ApiResponse(200, { asset, assetHistory }, "Asset fetched successfully"));

        } else {
            const page = Math.max(parseInt(req.query.page) || 1, 1);
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);
            const skip = (page - 1) * limit;

            if (req.user.role !== "HR") {
                const filter = { currentOwner: req.user.id };
                const [assets, total] = await Promise.all([
                    this.repo.find(filter).skip(skip).limit(limit),
                    this.repo.countDocuments(filter),
                ]);
                return res.status(200).json(new ApiResponse(200, {
                    assets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
                }, "Assets fetched successfully"));
            }

            const userId = req.query.userId;
            if (userId) {
                const filter = { currentOwner: userId };
                const [assets, total] = await Promise.all([
                    this.repo.find(filter).skip(skip).limit(limit),
                    this.repo.countDocuments(filter),
                ]);
                return res.status(200).json(new ApiResponse(200, {
                    assets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
                }, "Assets fetched successfully"));
            }

            const departmentId = req.query.departmentId;
            if (departmentId) {
                const matchStage = {
                    "owner.deptId": new mongoose.Types.ObjectId(departmentId),
                };
                const [result] = await this.repo.aggregate([
                    {
                        $lookup: {
                            from: "users",
                            localField: "currentOwner",
                            foreignField: "_id",
                            as: "owner",
                        },
                    },
                    { $unwind: "$owner" },
                    { $match: matchStage },
                    { $project: { owner: 0 } },
                    {
                        $facet: {
                            assets: [{ $skip: skip }, { $limit: limit }],
                            count: [{ $count: "total" }],
                        },
                    },
                ]);
                const assets = result.assets;
                const total = result.count[0]?.total || 0;
                return res.status(200).json(new ApiResponse(200, {
                    assets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
                }, "Assets fetched successfully"));
            }

            const [assets, total] = await Promise.all([
                this.repo.find().skip(skip).limit(limit),
                this.repo.countDocuments(),
            ]);
            return res.status(200).json(new ApiResponse(200, {
                assets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }, "Assets fetched successfully"));
        }
    })

    GetSignedUrl = AsyncHandler(async (req, res) => {
        if (req.user.role !== "HR") {
            throw new ApiError(Types.Errors.Forbidden, "You are not authorized to upload asset photos");
        }
        const { fileName, contentType } = req.query;
        if (!fileName || !contentType) {
            throw new ApiError(Types.Errors.BadRequest, "fileName and contentType are required");
        }
        const signedUrl = await GenerateUploadUrl(`assets/${Date.now()}-${fileName}`, contentType, "assets");
        return res.status(200).json(new ApiResponse(200, { signedUrl }, "Signed URL generated successfully"));
    })

    GetStats = AsyncHandler(async (req, res) => {
        const [totalAssets, availableCount, assignedCount, maintenanceCount, disposedCount, assetsByDepartment] = await Promise.all([
            this.repo.countDocuments(),
            this.repo.countDocuments({ status: "AVAILABLE" }),
            this.repo.countDocuments({ status: "ASSIGNED" }),
            this.repo.countDocuments({ status: "MAINTENANCE" }),
            this.repo.countDocuments({ status: "DISPOSED" }),
            this.repo.aggregate([
                {
                    $lookup: {
                        from: "users",
                        localField: "currentOwner",
                        foreignField: "_id",
                        as: "owner",
                    },
                },
                { $unwind: "$owner" },
                {
                    $group: {
                        _id: "$owner.deptId",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);
        return res.status(200).json(new ApiResponse(200, {
            totalAssets,
            availableCount,
            assignedCount,
            maintenanceCount,
            disposedCount,
            assetsByDepartment,
        }, "Asset stats fetched successfully"));
    })
}

export default AssetController;
