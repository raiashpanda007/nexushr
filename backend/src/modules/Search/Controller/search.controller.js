import UserModel from "../../Users/models/users.models.js";
import DepartmentModal from "../../Departments/Models/departments.models.js";
import SkillModal from "../../Skills/models/skills.models.js";
import LeaveTypeModal from "../../Leaves/LeaveTypes/Models/leavetypes.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import mongoose from "mongoose";

const usersLookups = [
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
];

/**
 * Build extra $match filters from query params for a given config.
 * Each config can declare an optional `filters` function that receives
 * req.query and returns a Mongoose filter object (merged into the match stage).
 */
const MAP = {
  users: {
    model: UserModel,
    searchFields: ["firstName", "lastName", "email", "role"],
    lookups: usersLookups,
    project: { $project: { passwordHash: 0 } },
    // Supported extra filters: deptId
    filters: (query) => {
      const extra = {};
      if (query.deptId) {
        extra.deptId = new mongoose.Types.ObjectId(query.deptId);
      }
      return extra;
    },
  },
  // Alias so the client can hit /search/employees for clarity
  employees: {
    model: UserModel,
    searchFields: ["firstName", "lastName", "email", "role"],
    lookups: usersLookups,
    project: { $project: { passwordHash: 0 } },
    filters: (query) => {
      const extra = {};
      if (query.deptId) {
        extra.deptId = new mongoose.Types.ObjectId(query.deptId);
      }
      return extra;
    },
  },
  departments: {
    model: DepartmentModal,
    searchFields: ["name", "description"],
    lookups: [],
    project: null,
    filters: () => ({}),
  },
  skills: {
    model: SkillModal,
    searchFields: ["name", "category"],
    lookups: [],
    project: null,
    filters: () => ({}),
  },
  leaveTypes: {
    model: LeaveTypeModal,
    searchFields: ["name", "code"],
    lookups: [],
    project: null,
    filters: () => ({}),
  },
};

class SearchController {
  constructor() {
    this.map = MAP;
  }

  Search = AsyncHandler(async (req, res) => {
    const { query } = req.query;
    const { model } = req.params;
    if (!model) {
      throw new ApiError(400, "Model is required");
    }

    const config = this.map[model];
    if (!config) {
      throw new ApiError(404, "Model not found");
    }

    // Build extra filters (e.g. deptId for employees/users)
    const extraFilters = config.filters ? config.filters(req.query) : {};

    let matchCondition = {};

    if (query) {
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedQuery, "i");
      const textMatch = {
        $or: config.searchFields.map((field) => ({
          [field]: { $regex: regex },
        })),
      };
      // Combine text search with extra filters
      matchCondition = Object.keys(extraFilters).length
        ? { $and: [textMatch, extraFilters] }
        : textMatch;
    } else if (Object.keys(extraFilters).length) {
      // Filter-only search (no text query required)
      matchCondition = extraFilters;
    } else {
      throw new ApiError(400, "At least a query or a filter parameter is required");
    }

    const pipeline = [{ $match: matchCondition }, ...config.lookups];

    if (config.project) {
      pipeline.push(config.project);
    }

    const result = await config.model.aggregate(pipeline);
    return res.status(200).json(new ApiResponse(200, result, "Search results"));
  });
}

export default SearchController;
