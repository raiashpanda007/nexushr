import AssetModel from "../Models/assets.models.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/ApiError.js";
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
        if (req.user.role !== "HR") {
            const userId = req.user.id;
            const id = req.params.id;
            const asset = await this.repo.findById(id);
            if (asset.currentOwner !== userId) {
                throw new ApiError(Types.Errors.Forbidden, "You are not authorized to get this asset");
            }
            return res.status(200).json(new ApiResponse(200, asset, "Asset fetched successfully"));
        }


    })
}

export default AssetController;
