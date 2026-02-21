
import SalariesModel from "../Models/salaries.model.js";
import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";
class SalariesController {
    constructor() {
        this.repo = SalariesModel;
    }


    Create = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can create salary");
        }

        const parsedBody = Types.Salaries.Create.safeParse(req.body);

        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.BadRequest, "Please provide valid data to create salary");
        }

        const { baseSalary, hra, lta, userId } = parsedBody.data;

        const savedSalary = await SalariesModel.create({
            base: baseSalary,
            hra,
            lta,
            userId
        })

        console.log("SAVED SALARY :: ", savedSalary);
        return res.status(201).json(new ApiResponse(201, savedSalary, "Created salary"))
    })


    Update = AsyncHandler(async (req, res) => {

        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can update salary");
        }
        const id = req.params.id;

        const parsedBody = Types.Salaries.Update.safeParse(req.body);

        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.BadRequest, "Please provide valid data to update salary");
        }

        const { baseSalary, hra, lta } = parsedBody.data;

        const updatedSalary = await SalariesModel.findByIdAndUpdate(id, {
            base: baseSalary,
            hra,
            lta
        }, { new: true })

        console.log("UPDATED SALARY :: ", updatedSalary);
        return res.status(200).json(new ApiResponse(200, updatedSalary, "Updated salary"))
    })

    Delete = AsyncHandler(async (req, res) => {
        if (req.user.role != "HR") {
            throw new ApiError(Types.Errors.Forbidden, "Only HR can delete salary");
        }
        const id = req.params.id;
        const deletedSalary = await SalariesModel.findByIdAndDelete(id)

        console.log("DELETED SALARY :: ", deletedSalary);
        return res.status(200).json(new ApiResponse(200, deletedSalary, "Deleted salary"))
    })

    Get = AsyncHandler(async (req, res) => {
        const id = req.params.id;
        const populateOptions = {
            path: "userId",
            select: "firstName lastName email deptId skills",
            populate: [
                { path: "deptId", select: "name" },
                { path: "skills", select: "name" }
            ]
        };

        const { page: pageQuery, limit: limitQuery } = req.query;
        let limit = parseInt(limitQuery) || 10;
        let page = parseInt(pageQuery) || 1;
        if (limit > 100) limit = 100;
        const skip = (page - 1) * limit;

        if (!id) {
            if (req.user.role != "HR") {
                let queryOptions = SalariesModel.find({ userId: req.user.id }).populate(populateOptions);
                if (limitQuery !== 'all') queryOptions = queryOptions.skip(skip).limit(limit);

                const salary = await queryOptions;
                const total = await SalariesModel.countDocuments({ userId: req.user.id });
                return res.status(200).json(new ApiResponse(200, { data: salary, total, page, limit: limitQuery === 'all' ? total : limit }, "Salary fetched successfully"));
            }

            const query = {};
            if (req.query.userId) {
                query.userId = req.query.userId;
            }

            let queryOptions = SalariesModel.find(query).populate(populateOptions);
            if (limitQuery !== 'all') queryOptions = queryOptions.skip(skip).limit(limit);

            const salaries = await queryOptions;
            const total = await SalariesModel.countDocuments(query);
            return res.status(200).json(new ApiResponse(200, { data: salaries, total, page, limit: limitQuery === 'all' ? total : limit }, "All salaries fetched successfully"));
        }

        const salary = await SalariesModel.findById(id).populate(populateOptions);

        if (req.user.role != "HR") {
            if (!salary || salary.userId?._id?.toString() !== req.user.id) {
                throw new ApiError(Types.Errors.NotFound, "Salary not found");
            }
            return res.status(200).json(new ApiResponse(200, salary, "Salary fetched successfully"));
        }

        return res.status(200).json(new ApiResponse(200, salary, "Salary fetched successfully"));
    })

}


export default SalariesController;