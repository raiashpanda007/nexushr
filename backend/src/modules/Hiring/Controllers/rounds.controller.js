import OpeningModel from "../Models/openings.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";
class RoundController {
  constructor() {
    this.openingRepo = OpeningModel;
  }

  Get = AsyncHandler(async (req, res) => {
    const openingId = req.query.openingId;
    if (!openingId) {
      throw new ApiError(
        Types.Errors.BadRequest,
        "openingId query parameter is required to filter rounds",
      );
    }
    const rounds = await this.openingRepo.findById(openingId).select("rounds").populate({
      path: "rounds",
      select: "name description type",
    });
    return res
      .status(200)
      .json(new ApiResponse(200, { rounds }, "Rounds retrieved successfully"));
  });
}

export default RoundController;
