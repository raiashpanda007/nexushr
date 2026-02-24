import UserModel from "../../Users/models/users.models.js";
import DepartmentModal from "../../Departments/Models/departments.models.js";
import SkillModal from "../../Skills/models/skills.models.js";
import LeaveTypeModal from "../../Leaves/LeaveTypes/Models/leavetypes.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";

const MAP = {
  users: {
    model: UserModel,
    searchFields: ["firstName", "lastName", "email", "role"],
    lookups: [
      {
        $lookup: {
          from: "departments",
          localField: "deptId",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1 } }],
          as: "deptId",
        },
      },
      {
        $unwind: {
          path: "$deptId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "skills",
          localField: "skills",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1 } }],
          as: "skills",
        },
      },
    ],
    project: { $project: { passwordHash: 0 } },
  },
  departments: {
    model: DepartmentModal,
    searchFields: ["name", "description"],
    lookups: [],
    project: null,
  },
  skills: {
    model: SkillModal,
    searchFields: ["name", "category"],
    lookups: [],
    project: null,
  },
  leaveTypes: {
    model: LeaveTypeModal,
    searchFields: ["name", "code"],
    lookups: [],
    project: null,
  },
};

class SearchController {
  constructor() {
    this.map = MAP;
  }

  Search = AsyncHandler(async (req, res) => {
    const { query } = req.query;
    const { model } = req.params;
    if (!query || !model) {
      throw new ApiError(400, "Query and model are required");
    }

    const config = this.map[model];
    if (!config) {
      throw new ApiError(404, "Model not found");
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedQuery, "i");

    const matchStage = {
      $match: {
        $or: config.searchFields.map((field) => ({
          [field]: { $regex: regex },
        })),
      },
    };

    const pipeline = [matchStage, ...config.lookups];

    if (config.project) {
      pipeline.push(config.project);
    }

    const result = await config.model.aggregate(pipeline);
    return res.status(200).json(new ApiResponse(200, result, "Search results"));
  });
}

export default SearchController;
