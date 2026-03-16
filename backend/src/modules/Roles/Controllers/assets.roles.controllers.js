import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";
import AssetsModel from "../../Assets/Models/assets.models.js";
import AssetsHistoryModel from "../../Assets/Models/asset.history.model.js";
import AssetModel from "../../Assets/Models/assets.models.js";
class AssetRoleController {

  constructor() {
    this.assetRepo = AssetModel
    this.assetHistoryRepo = AssetsHistoryModel;
  }

}
