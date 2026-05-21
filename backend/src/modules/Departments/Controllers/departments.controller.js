import DepartmentModal from "../Models/departments.models.js";
import { ApiError, AsyncHandler, ApiResponse, buildDeptSnapshot } from "../../../utils/index.js"
import Types from "../../../types/index.js"
import UserModel from "../../Users/models/users.models.js"
import AttendanceModel from "../../Attendance/Models/attendance.model.js"
import LeaveBalanceModel from "../../Leaves/LeavesBalances/Models/leavesBalances.model.js"
import LeaveRequestModel from "../../Leaves/LeaveRequests/Models/leaveRequests.model.js"
import PayrollModel from "../../Payroll/Models/payroll.model.js"
import SalariesModel from "../../Salaries/Models/salaries.model.js"
import OpeningModel from "../../Hiring/Models/openings.model.js"
import ApplicantModel from "../../Hiring/Models/applicants.model.js"
import InterviewModel from "../../Hiring/Models/interview.model.js"
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

        const deptSnapshot = buildDeptSnapshot(department);
        await Promise.all([
            UserModel.updateMany({ deptId: id }, { $set: { deptSnapshot } }),
            AttendanceModel.updateMany(
                { "userSnapshot.deptId": id },
                { $set: { "userSnapshot.deptName": deptSnapshot.name } },
            ),
            LeaveBalanceModel.updateMany(
                { "userSnapshot.deptId": id },
                { $set: { "userSnapshot.deptName": deptSnapshot.name } },
            ),
            LeaveRequestModel.updateMany(
                { "requestedBySnapshot.deptId": id },
                { $set: { "requestedBySnapshot.deptName": deptSnapshot.name } },
            ),
            LeaveRequestModel.updateMany(
                { "respondedBySnapshot.deptId": id },
                { $set: { "respondedBySnapshot.deptName": deptSnapshot.name } },
            ),
            PayrollModel.updateMany(
                { "userSnapshot.deptId": id },
                { $set: { "userSnapshot.deptName": deptSnapshot.name } },
            ),
            SalariesModel.updateMany(
                { "userSnapshot.deptId": id },
                { $set: { "userSnapshot.deptName": deptSnapshot.name } },
            ),
            OpeningModel.updateMany(
                { departmentId: id },
                { $set: { departmentSnapshot: deptSnapshot } },
            ),
            ApplicantModel.updateMany(
                { "openingSnapshot.departmentId": id },
                { $set: { "openingSnapshot.departmentName": deptSnapshot.name } },
            ),
            InterviewModel.updateMany(
                { "openingSnapshot.departmentId": id },
                { $set: { "openingSnapshot.departmentName": deptSnapshot.name } },
            ),
        ]);
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