import { DepartmentModal } from "../Models/departments.models.js";
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
        const id = req.params.id
        if (id) {
            const department = await this.repo.findById(id)
            if (!department) {
                throw new ApiError(Types.Errors.NotFound, "Department not found")
            }
            return res.status(200).json(new ApiResponse(200, department, "Department fetched successfully"))
        }
        const departments = await this.repo.find()
        return res.status(200).json(new ApiResponse(200, departments, "Departments fetched successfully"))
    })


}

export default DepartmentsController;