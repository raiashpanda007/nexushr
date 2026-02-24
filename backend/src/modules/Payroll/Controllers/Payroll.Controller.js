import mongoose from "mongoose";
import PayrollModal from "../Models/payroll.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import LeaveRequestModal from "../../Leaves/LeaveRequests/Models/leaveRequests.model.js";
import SalaryModal from "../../Salaries/Models/salaries.model.js";
import Types from "../../../types/index.js"

function getDaysInMonth(year, monthIndex) {
    const date = new Date(year, monthIndex, 1);
    const days = [];

    while (date.getMonth() === monthIndex) {
        days.push(new Date(date));
        date.setDate(date.getDate() + 1);
    }

    return days.length;
}



class PayrollController {

    constructor() {
        this.repo = PayrollModal;
    }


    Create = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "You are not allowed to create payroll");
        }
        const parsedBody = Types.Payroll.Create.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.UnprocessableData, "Invalid data", parsedBody.error.issues);
        }
        const { user, bonus, deduction, salary, month, year } = parsedBody.data;

        const payroll = await this.repo.create({
            user,
            bonus,
            deduction,
            salary,
            month,
            year
        })

        return res.status(200).json(new ApiResponse(200, payroll, "Payroll created successfully"));

    })



    Get = AsyncHandler(async (req, res) => {
        const id = req.params.id;
        const month = Number(req.query.month);
        const year = Number(req.query.year);

        if (month > 12 || month < 1 || month >= new Date().getMonth()) {
            throw new ApiError(Types.Errors.NotFound, "Invalid month");
        }
        if (year > 2100 || year < 1900 || year <= new Date().getFullYear()) {
            throw new ApiError(Types.Errors.NotFound, "Invalid year");
        }
        const { page: pageQuery, limit: limitQuery } = req.query;
        let limit = parseInt(limitQuery) || 10;
        let page = parseInt(pageQuery) || 1;
        if (limit > 100) limit = 100;
        const skip = (page - 1) * limit;

        if (!id) {
            let filter = {};
            if (req.user.role !== "HR") {
                filter.user = req.user.id;
            }
            if (year) {
                filter.year = year;
                if (month) {
                    filter.month = month;
                    const payroll = await this.repo.findOne(filter).populate("salary").populate("user", "firstName lastName email profilePhoto");
                    return res.status(200).json(new ApiResponse(200, payroll, "Payroll fetched successfully"));
                }
            }

            let queryOptions = this.repo.find(filter).populate("salary").populate("user", "firstName lastName email profilePhoto");
            if (limitQuery !== 'all') {
                queryOptions = queryOptions.skip(skip).limit(limit);
            }
            const payrolls = await queryOptions;
            const total = await this.repo.countDocuments(filter);

            return res.status(200).json(new ApiResponse(200, { data: payrolls, total, page, limit: limitQuery === 'all' ? total : limit }, "Payroll fetched successfully"));
        }

        const payroll = await this.repo.findById(id).populate("salary").populate("user", "firstName lastName email profilePhoto");

        if (req.user.role != "HR" && payroll.user != req.user.id) {
            throw new ApiError(Types.Errors.NotFound, "Payroll not found");
        }

        return res.status(200).json(new ApiResponse(200, payroll, "Payroll fetched successfully"));

    })

    GetLeaveDeductions = AsyncHandler(async (req, res) => {
        const user = req.params.id;
        const month = Number(req.query.month);
        const year = Number(req.query.year);
        const salary = req.query.salary;

        if (!user) {
            throw new ApiError(Types.Errors.NotFound, "User not found");
        }
        if (!month || month > 12 || month < 1) {
            throw new ApiError(Types.Errors.UnprocessableData, "Invalid month");
        }
        if (!year || year > 2100 || year < 1900) {
            throw new ApiError(Types.Errors.UnprocessableData, "Invalid year");
        }

        const leaveRequests = await LeaveRequestModal.aggregate([
            {
                $match: {
                    status: "ACCEPTED",
                    requestedBy: new mongoose.Types.ObjectId(user),
                    from: {
                        $gte: new Date(year, month - 1, 1),
                        $lte: new Date(year, month, 0)
                    },
                    to: {
                        $gte: new Date(year, month - 1, 1),
                        $lte: new Date(year, month, 0)
                    }
                }
            },
            {
                $lookup: {
                    from: "leavetypes",
                    localField: "type",
                    foreignField: "_id",
                    as: "type"
                }
            },
            {
                $match: {
                    "type.isPaid": false
                }
            },

        ])

        const selectedSalary = salary
            ? await SalaryModal.findById(salary)
            : await SalaryModal.findOne({ userId: user });

        if (!selectedSalary) {
            throw new ApiError(Types.Errors.NotFound, "Salary not found");
        }

        const perDaySalary = selectedSalary.base / getDaysInMonth(year, month - 1);

        const deductionsOnLeave = [];
        for (const leave of leaveRequests) {
            const type = leave.type[0];
            const quantity = leave.quantity;
            const amount = quantity * perDaySalary;
            deductionsOnLeave.push({
                reason: type.name,
                amount
            })
        }

        const totalDeduction = deductionsOnLeave.reduce((total, deduction) => {
            return total + deduction.amount;
        }, 0);

        return res.status(200).json(new ApiResponse(200, { deductionsOnLeave, totalDeduction }, "Leave requests fetched successfully"));

    })

}

export default PayrollController;
