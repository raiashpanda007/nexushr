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
        if (!id) {
            if (req.user.role != "HR") {
                if (!year) {
                    const payroll = await this.repo.find({ user: req.user.id }).populate("salary")
                    return res.status(200).json(new ApiResponse(200, payroll, "Payroll fetched successfully"));
                } else {
                    if (month) {
                        const payroll = await this.repo.findOne({ user: req.user.id, month, year }).populate("salary")
                        return res.status(200).json(new ApiResponse(200, payroll, "Payroll fetched successfully"));
                    }
                    const payroll = await this.repo.find({ user: req.user.id, year }).populate("salary")
                    return res.status(200).json(new ApiResponse(200, payroll, "Payroll fetched successfully"));
                }
            } else {
                if (!year) {
                    const payroll = await this.repo.find().populate("salary")
                    return res.status(200).json(new ApiResponse(200, payroll, "Payroll fetched successfully"));
                } else {
                    if (month) {
                        const payroll = await this.repo.findOne({ month, year }).populate("salary")
                        return res.status(200).json(new ApiResponse(200, payroll, "Payroll fetched successfully"));
                    }
                    const payroll = await this.repo.find({ year }).populate("salary")
                    return res.status(200).json(new ApiResponse(200, payroll, "Payroll fetched successfully"));
                }
            }
        }

        const payroll = await this.repo.findById(id).populate("salary")

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
        if (month > 12 || month < 1 || month >= new Date().getMonth()) {
            throw new ApiError(Types.Errors.NotFound, "Invalid month");
        }
        if (year > 2100 || year < 1900 || year <= new Date().getFullYear()) {
            throw new ApiError(Types.Errors.NotFound, "Invalid year");
        }

        const leaveRequests = await LeaveRequestModal.aggregate([
            {
                $match: {
                    status: "ACCEPTED",
                    requestedBy: user,
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
                    from: "LeaveTypes",
                    localField: "type",
                    foreignField: "_id",
                    as: "type"
                }
            },
            {
                $match: {
                    "type[0].isPaid": false
                }
            },

        ])

        const selectedSalary = await SalaryModal.findOne({ user, month, year })

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
