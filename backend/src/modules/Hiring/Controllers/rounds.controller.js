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
    const result = await this.openingRepo
      .findById(openingId)
      .select("rounds")
      .populate({ path: "rounds.round", select: "name description type" })
      .lean();
    const rounds = result
      ? (result.rounds || [])
          .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
          .map(r => ({
            _id: r.round?._id,
            name: r.round?.name,
            description: r.round?.description,
            type: r.round?.type,
            rank: r.rank,
          }))
      : [];
    return res
      .status(200)
      .json(new ApiResponse(200, { rounds }, "Rounds retrieved successfully"));
  });
}

export default RoundController;
