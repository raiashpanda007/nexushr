import UserModel from "../../Users/models/users.models.js"
import DepartmentModal from "../../Departments/Models/departments.models.js"
import SkillModal from "../../Skills/models/skills.models.js"
import LeaveTypeModal from "../../Leaves/LeaveTypes/Models/leavetypes.model.js"
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js"
const MAP = {
    "users": UserModel,
    "departments": DepartmentModal,
    "skills": SkillModal,
    "leaveTypes": LeaveTypeModal,
}

class SearchController {

    constructor() {
        this.map = MAP
    }

    Search = AsyncHandler(async (req, res) => {
        const { query } = req.query
        const { model } = req.params
        if (!query || !model) {
            throw new ApiError(400, "Query and model are required")
        }
        const modelInstance = this.map[model]
        if (!modelInstance) {
            throw new ApiError(404, "Model not found")
        }
        const result = await modelInstance.find(
            { $text: { $search: query } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } });
        return res.status(200).json(new ApiResponse(200, result, "Search results"))
    })


}


export default SearchController;