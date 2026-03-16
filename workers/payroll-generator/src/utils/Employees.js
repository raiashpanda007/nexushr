import { ObjectId } from "mongodb";

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}


async function* GetEmployeeBatches(dbInstance, departments, month, year) {
  try {
    const collection = dbInstance.getCollection("users");

    const isAll = departments === "All";
    console.log("isAll:", isAll, "departments:", departments);
    const deptObjectIds = isAll ? [] : departments.map((id) => new ObjectId(id));
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const totalDays = getDaysInMonth(year, month - 1);

    const pipeline = [
      //  1. Match employees belonging to the selected departments (skip filter if "All"); 
      ...(isAll
        ? []
        : [{ $match: { deptId: { $in: deptObjectIds } } }]),

      //  2. Get the most-recent payroll for each employee ;

      {
        $lookup: {
          from: "payrolls",
          let: { userId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
            { $sort: { _id: -1 } },
            { $limit: 1 },
          ],
          as: "lastPayroll",
        },
      },
      {
        $unwind: { path: "$lastPayroll", preserveNullAndEmptyArrays: true },
      },

      //  3. Lookup the salary referenced by the last payroll 
      //       Falls back to the employee's current salary if no payroll exists
      {
        $lookup: {
          from: "salaries",
          let: {
            salaryId: { $ifNull: ["$lastPayroll.salary", null] },
            empId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: {
                    if: { $ne: ["$$salaryId", null] },
                    then: { $eq: ["$_id", "$$salaryId"] },
                    else: { $eq: ["$userId", "$$empId"] },
                  },
                },
              },
            },
            { $sort: { _id: -1 } },
            { $limit: 1 },
          ],
          as: "salary",
        },
      },
      { $unwind: { path: "$salary", preserveNullAndEmptyArrays: true } },

      //  4. Lookup ACCEPTED unpaid-leave requests for the month 
      //       Mirrors PayrollController.GetLeaveDeductions
      {
        $lookup: {
          from: "leaverequests",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$requestedBy", "$$userId"] },
                status: "ACCEPTED",
                from: { $gte: startOfMonth, $lte: endOfMonth },
                to: { $gte: startOfMonth, $lte: endOfMonth },
              },
            },
            // Join leave type to check isPaid
            {
              $lookup: {
                from: "leavetypes",
                localField: "type",
                foreignField: "_id",
                as: "leaveType",
              },
            },
            { $unwind: "$leaveType" },
            // Keep only unpaid leaves
            { $match: { "leaveType.isPaid": false } },
            {
              $project: {
                _id: 0,
                reason: "$leaveType.name",
                quantity: 1,
              },
            },
          ],
          as: "unpaidLeaves",
        },
      },

      //  5. Count distinct present days from attendance 
      {
        $lookup: {
          from: "attendances",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$user", "$$userId"] },
                date: { $gte: startOfMonth, $lte: endOfMonth },
              },
            },
            { $group: { _id: { $dayOfMonth: "$date" } } },
            { $count: "presentDays" },
          ],
          as: "attendance",
        },
      },

      //  6. Compute per-day salary, present/absent days 
      {
        $addFields: {
          perDaySalary: {
            $cond: {
              if: { $gt: [{ $ifNull: ["$salary.base", 0] }, 0] },
              then: { $divide: ["$salary.base", totalDays] },
              else: 0,
            },
          },
          presentDays: {
            $ifNull: [
              { $arrayElemAt: ["$attendance.presentDays", 0] },
              0,
            ],
          },
        },
      },
      {
        $addFields: {
          absentDays: { $subtract: [totalDays, "$presentDays"] },
        },
      },

      //  7. Compute leave deduction amounts (quantity × perDaySalary) 
      {
        $addFields: {
          leaveDeductions: {
            $map: {
              input: "$unpaidLeaves",
              as: "leave",
              in: {
                reason: "$$leave.reason",
                amount: {
                  $multiply: ["$$leave.quantity", "$perDaySalary"],
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          totalLeaveDeduction: {
            $reduce: {
              input: "$leaveDeductions",
              initialValue: 0,
              in: { $add: ["$$value", "$$this.amount"] },
            },
          },
        },
      },

      //  8. Final projection 
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          deptId: 1,
          salary: {
            _id: "$salary._id",
            base: "$salary.base",
            hra: "$salary.hra",
            lta: "$salary.lta",
          },
          lastPayroll: {
            _id: "$lastPayroll._id",
            month: "$lastPayroll.month",
            year: "$lastPayroll.year",
            bonus: { $ifNull: ["$lastPayroll.bonus", []] },
          },
          perDaySalary: 1,
          presentDays: 1,
          absentDays: 1,
          leaveDeductions: 1,
          totalLeaveDeduction: 1,
        },
      },
    ];

    const BATCH_SIZE = 1000;
    const cursor = collection.aggregate(pipeline).batchSize(BATCH_SIZE);

    let batch = [];
    for await (const doc of cursor) {
      batch.push(doc);
      if (batch.length >= BATCH_SIZE) {
        yield batch;
        batch = [];
      }
    }

    if (batch.length > 0) {
      yield batch;
    }
  } catch (error) {
    console.error("Error fetching employees:", error);
    throw error;
  }
}

export default GetEmployeeBatches;

