import DepartmentModal from "../Models/departments.models.js";
import { ApiError, AsyncHandler, ApiResponse } from "../../../utils/index.js"
import Types from "../../../types/index.js"
class DepartmentsController {

    constructor() {
        this.repo = DepartmentModal
    }

    Create = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can create departments")
        }
        const parsedBody = Types.Departments.Create.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.UnprocessableData, "Invalid data")
        }
        const { name, description } = parsedBody.data
        const department = await this.repo.create({ name, description })
        return res.status(201).json(new ApiResponse(201, department, "Department created successfully"))
    })

    Update = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can update departments")
        }
        const id = req.params.id
        if (!id) {
            throw new ApiError(Types.Errors.BadRequest, "Department id is required")
        }
        const parsedBody = Types.Departments.Update.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.UnprocessableData, "Invalid data")
        }
        const { name, description } = parsedBody.data
        const department = await this.repo.findByIdAndUpdate(id, { name, description }, { new: true })
        if (!department) {
            throw new ApiError(Types.Errors.NotFound, "Department not found")
        }
        return res.status(200).json(new ApiResponse(200, department, "Department updated successfully"))
    })

    Delete = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can delete departments")
        }
        const id = req.params.id
        if (!id) {
            throw new ApiError(Types.Errors.BadRequest, "Department id is required")
        }
        const department = await this.repo.findByIdAndDelete(id)
        if (!department) {
            throw new ApiError(Types.Errors.NotFound, "Department not found")
        }
        return res.status(200).json(new ApiResponse(200, department, "Department deleted successfully"))
    })

    Get = AsyncHandler(async (req, res) => {
        const id = req.params.id;
        const { page: pageQuery, limit: limitQuery } = req.query;
        let limit = parseInt(limitQuery) || 10;
        let page = parseInt(pageQuery) || 1;
        if (limit > 100) limit = 100;

        const skip = (page - 1) * limit;

        if (id) {
            const department = await this.repo.findById(id)
            if (!department) {
                throw new ApiError(Types.Errors.NotFound, "Department not found")
            }
            return res.status(200).json(new ApiResponse(200, department, "Department fetched successfully"))
        }

        let queryOptions = this.repo.find();
        if (limitQuery !== 'all') {
            queryOptions = queryOptions.skip(skip).limit(limit);
        }

        const departments = await queryOptions;
        const total = await this.repo.countDocuments();
        return res.status(200).json(new ApiResponse(200, { data: departments, total, page, limit: limitQuery === 'all' ? total : limit }, "Departments fetched successfully"))
    })


}

export default DepartmentsController;