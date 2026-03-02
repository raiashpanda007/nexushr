import EventModel from "../Models/Events.models.js";
import Types from "../../../types/index.js";
import UserModel from "../../Users/models/users.models.js"
import { mongoose } from "mongoose";
import {
  AsyncHandler,
  ApiResponse,
  ApiError,
} from "../../../utils/index.js";
class EventsController {
  constructor() {
    this.repo = EventModel;
  }

  Create = AsyncHandler(async (req, res) => {
    if (!req.user || req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can create employee");
    }

    const parsedBody = Types.Events.Create.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(Types.Errors.UnprocessableData).json(new ApiResponse(Types.Errors.UnprocessableData, null, parsedBody.error.issues[0]?.message || "Validation Failed"));
    }
    const {
      employees,
      departments,
      time,
      type,
      name,
      description,
      date,
      forAll,
    } = parsedBody.data;

    // Combine date + time into a single DateTime and compare to now
    const [hours = 0, minutes = 0] = String(time).split(':').map(Number);
    const eventDateTime = new Date(date);
    eventDateTime.setHours(hours, minutes, 0, 0);
    if (eventDateTime < new Date()) {
      return res.status(Types.Errors.UnprocessableData).json(new ApiResponse(Types.Errors.UnprocessableData, null, "Event date and time cannot be in the past"));
    }
    if (employees.length === 0 && departments.length === 0 && !forAll) {
      return res.status(Types.Errors.BadRequest).json(new ApiResponse(Types.Errors.BadRequest, null, "Event must be associated with at least one department or employee or be for all"));
    }
    const event = await this.repo.create({
      name,
      description,
      date,
      time,
      type,
      forAll,
      resepectedEmplooyees: employees,
      respectedToDepartments: departments,
    });

    return res.status(201).json(new ApiResponse(201, event, "Event Created Successfully"));
  });

  Update = AsyncHandler(async (req, res) => {
    if (!req.user || req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can update employee");
    }

    const parsedBody = Types.Events.Update.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(Types.Errors.UnprocessableData).json(new ApiResponse(Types.Errors.UnprocessableData, null, parsedBody.error.issues[0]?.message || "Validation Failed"));
    }
    const id = req.params.id;

    if (!id) {
      return res.status(Types.Errors.BadRequest).json(new ApiResponse(Types.Errors.BadRequest, null, "Event ID is required"));
    }
    const { employees, departments, time, date, forAll, name, description, type } = parsedBody.data;
    const [hours = 0, minutes = 0] = String(time).split(':').map(Number);
    const eventDateTime = new Date(date);
    eventDateTime.setHours(hours, minutes, 0, 0)
    if (eventDateTime < new Date()) {
      return res
        .status(Types.Errors.UnprocessableData)
        .json(
          new ApiResponse(
            Types.Errors.UnprocessableData,
            null,
            "Event date cannot be in the past",
          ),
        );
    }
    if (time) {
      const [h = 0, m = 0] = String(time).split(':').map(Number);
      const base = date ? new Date(date) : new Date();
      base.setHours(h, m, 0, 0);
      if (base < new Date()) {
        return res.status(Types.Errors.UnprocessableData).json(new ApiResponse(Types.Errors.UnprocessableData, null, "Event time cannot be in the past"));
      }
    }
    if (
      employees &&
      employees.length === 0 &&
      (!departments || departments.length === 0) &&
      !forAll
    ) {
      return res.status(Types.Errors.BadRequest).json(
        new ApiResponse(
          Types.Errors.BadRequest,
          null,
          "Event must be associated with at least one department or employee or be for all",
        ),
      );
    }
    const updatedEvent = await this.repo.findByIdAndUpdate(id, {
      ...(name && { name }),
      ...(description && { description }),
      ...(date && { date }),
      ...(time && { time }),
      ...(type && { type }),
      ...(forAll && { forAll }),
      ...(employees && { resepectedEmplooyees: employees }),
      ...(departments && { respectedToDepartments: departments }),
    }, { new: true });

    if (!updatedEvent) {
      return res.status(Types.Errors.NotFound).json(new ApiResponse(Types.Errors.NotFound, null, "Event not found"));
    }

    return res.status(200).json(new ApiResponse(200, updatedEvent, "Event Updated Successfully"));
  });
  Get = AsyncHandler(async (req, res) => {
    const eventId = req.params.id;

    if (eventId) {
      const event = await this.repo.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(eventId) } },
        {
          $lookup: {
            from: "users",
            localField: "resepectedEmplooyees",
            foreignField: "_id",
            as: "employeeDetails",
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "respectedToDepartments",
            foreignField: "_id",
            as: "departmentDetails",
          },
        },
      ]);

      if (!event || event.length === 0) {
        return res.status(Types.Errors.NotFound).json(new ApiResponse(Types.Errors.NotFound, null, "Event not found"));
      }

      return res.status(200).json(new ApiResponse(200, event[0], "Event Fetched Successfully"));

    }

    const userId = req.user.id;
    const userRole = req.user.role;
    const forFilter = req.query.for;
    const typeFilter = req.query.type;


    const validTypes = ["MEETING", "BIRTHDAY", "ANNIVERSARY", "OTHER", "HOLIDAY"];

    if (typeFilter && !validTypes.includes(typeFilter)) {
      return res.status(Types.Errors.BadRequest).json(
        new ApiResponse(Types.Errors.BadRequest, null, `Invalid type. Must be one of: ${validTypes.join(", ")}`)
      );
    }


    const now = new Date();
    const month = req.query.month ? parseInt(req.query.month) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const baseFilter = {
      date: { $gte: startDate, $lt: endDate },
      ...(typeFilter && { type: typeFilter }),
    };

    if (forFilter === "employee") {
      if (userRole === "HR") {
        const empId = req.query.empId;
        if (!empId) {
          return res.status(Types.Errors.BadRequest).json(
            new ApiResponse(Types.Errors.BadRequest, null, "empId query parameter is required for employee filter")
          );
        }
        const employeeEvents = await this.repo.find({
          resepectedEmplooyees: { $in: [empId] },
          ...baseFilter,
        });
        return res.status(200).json(new ApiResponse(200, employeeEvents, "Employee Events Fetched Successfully"));
      } else {
        const employeeEvents = await this.repo.find({
          resepectedEmplooyees: { $in: [userId] },
          ...baseFilter,
        });
        return res.status(200).json(new ApiResponse(200, employeeEvents, "Employee Events Fetched Successfully"));
      }
    }

    if (forFilter === "department") {
      if (userRole === "HR") {
        const deptId = req.query.deptId;
        if (!deptId) {
          return res.status(Types.Errors.BadRequest).json(
            new ApiResponse(Types.Errors.BadRequest, null, "deptId query parameter is required for department filter")
          );
        }
        const departmentEvents = await this.repo.find({
          respectedToDepartments: { $in: [deptId] },
          ...baseFilter,
        });
        return res.status(200).json(new ApiResponse(200, departmentEvents, "Department Events Fetched Successfully"));
      } else {
        const userDepartmentPipeline = await UserModel.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(userId) } },
          { $lookup: { from: "departments", localField: "department", foreignField: "_id", as: "department" } },
          { $unwind: "$department" },
          { $project: { department: 1 } },
        ]);

        const departmentEvents = await this.repo.find({
          respectedToDepartments: { $in: [userDepartmentPipeline[0].department._id] },
          ...baseFilter,
        });
        return res.status(200).json(new ApiResponse(200, departmentEvents, "Department Events Fetched Successfully"));
      }
    }

    if (forFilter === "all" || !forFilter) {
      if (userRole === "HR") {
        // HR sees all events for the month
        const allEvents = await this.repo.find(baseFilter);
        return res.status(200).json(new ApiResponse(200, allEvents, "All Events Fetched Successfully"));
      } else {
        // Employee sees: forAll events + their own events + their department events
        const userDepartmentPipeline = await UserModel.aggregate([
          { $match: { _id: new mongoose.Types.ObjectId(userId) } },
          { $lookup: { from: "departments", localField: "department", foreignField: "_id", as: "department" } },
          { $unwind: { path: "$department", preserveNullAndEmptyArrays: true } },
          { $project: { department: 1 } },
        ]);

        const deptId = userDepartmentPipeline[0]?.department?._id;
        const orConditions = [
          { forAll: true },
          { resepectedEmplooyees: { $in: [new mongoose.Types.ObjectId(userId)] } },
        ];
        if (deptId) {
          orConditions.push({ respectedToDepartments: { $in: [deptId] } });
        }

        const allEvents = await this.repo.find({
          $or: orConditions,
          ...baseFilter,
        });
        return res.status(200).json(new ApiResponse(200, allEvents, "All Events Fetched Successfully"));
      }
    }
  });

  Delete = AsyncHandler(async (req, res) => {
    if (!req.user || req.user.role != "HR") {
      throw new ApiError(Types.Errors.Forbidden, "Only HR can delete employee");
    }
    const { id } = req.params;
    const deletedEvent = await this.repo.findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(Types.Errors.NotFound).json(new ApiResponse(Types.Errors.NotFound, null, "Event not found"));
    }
    return res.status(200).json(new ApiResponse(200, deletedEvent, "Event Deleted Successfully"));
  });
}

export default EventsController;
