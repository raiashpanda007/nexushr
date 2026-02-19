import { AsyncHandler, ApiResponse, ApiError } from "../../../utils/index.js";
import Types from "../../../types/index.js";
import SkillModel from "../models/skills.models.js";

class SkillController {
    constructor() {
        this.repo = SkillModel;
    }

    Create = AsyncHandler(async (req, res) => {
        const parsedBody = Types.Skills.Create.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.BadRequest, "Please provide valid data to create a skill");
        }
        const { name, category } = parsedBody.data;
        const savedSkill = await this.repo.create({ name, category });
        return res.status(201).json(new ApiResponse(201, savedSkill, "Skill created successfully"));
    })

    Update = AsyncHandler(async (req, res) => {
        const skillId = req.params.id;
        if (!skillId) {
            throw new ApiError(Types.Errors.BadRequest, "Please provide a valid skill id");
        }
        if (!req.user || req.user.role !== "HR") {
            throw new ApiError(Types.Errors.Unauthorized, "You are not authorized to update a skill");
        }
        const parsedBody = Types.Skills.Update.safeParse(req.body);
        if (!parsedBody.success) {
            throw new ApiError(Types.Errors.BadRequest, "Please provide valid data to update a skill");
        }
        const { name, category } = parsedBody.data;
        const updatedSkill = await this.repo.findByIdAndUpdate(skillId, { name, category }, { new: true });
        return res.status(200).json(new ApiResponse(200, updatedSkill, "Skill updated successfully"));
    })

    Delete = AsyncHandler(async (req, res) => {
        const skillId = req.params.id;
        if (!skillId) {
            throw new ApiError(Types.Errors.BadRequest, "Please provide a valid skill id");
        }
        if (!req.user || req.user.role !== "HR") {
            throw new ApiError(Types.Errors.Unauthorized, "You are not authorized to delete a skill");
        }
        const skill = await this.repo.findById(skillId);
        if (!skill) {
            throw new ApiError(Types.Errors.NotFound, "Skill not found");
        }
        const deletedSkill = await this.repo.findByIdAndDelete(skillId);
        return res.status(200).json(new ApiResponse(200, deletedSkill, "Skill deleted successfully"));
    })

    Get = AsyncHandler(async (req, res) => {
        const skillId = req.params.id;
        if (!skillId) {
            const skills = await this.repo.find();
            return res.status(200).json(new ApiResponse(200, skills, "Skills fetched successfully"));
        }
        const skill = await this.repo.findById(skillId);
        if (!skill) {
            throw new ApiError(Types.Errors.NotFound, "Skill not found");
        }
        return res.status(200).json(new ApiResponse(200, skill, "Skill fetched successfully"));
    })

}

export default SkillController;