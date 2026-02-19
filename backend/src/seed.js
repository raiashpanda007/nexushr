import mongoose from "mongoose";
import { Cfg } from "./config/env.js";
import { UserModel } from "./modules/Users/models/users.models.js";
import { DepartmentModal } from "./modules/Departments/Models/departments.models.js";
import SkillModal from "./modules/Skills/models/skills.models.js";
import LeaveTypeModal from "./modules/Leaves/LeaveTypes/Models/leavetypes.model.js";
import LeaveBalanceModel from "./modules/Leaves/LeavesBalances/Models/leavesBalances.model.js";
import LeaveRequestModel from "./modules/Leaves/LeaveRequests/Models/leaveRequests.model.js";
import { SalariesModel } from "./modules/Salaries/salaries.model.js";
import AttendanceModel from "./modules/Attendance/attendance.model.js";
import { PayrollModal } from "./modules/Payroll/payroll.model.js";

const seed = async () => {
    try {
        await mongoose.connect(Cfg.MONGO_DB_URL, { dbName: Cfg.DB_NAME });
        console.log("Connected to MongoDB for seeding...");

        // Dummy Data Arrays
        const departments = [
            { name: "General Management", description: "Default department for administrative staff" },
            { name: "Human Resources", description: "Handles employee relations and benefits." },
            { name: "Engineering", description: "Responsible for software development and maintenance." },
            { name: "Marketing", description: "Handles advertising and brand management." },
            { name: "Sales", description: "Responsible for revenue generation and client acquisition." },
            { name: "Finance", description: "Manages company finances and accounting." }
        ];

        const skills = [
            { name: "Administration", category: "MANAGEMENT" },
            { name: "Java", category: "TECHNICAL" },
            { name: "Python", category: "TECHNICAL" },
            { name: "React", category: "TECHNICAL" },
            { name: "Project Management", category: "MANAGEMENT" },
            { name: "Communication", category: "SOFT_SKILL" },
            { name: "Leadership", category: "MANAGEMENT" },
            { name: "Data Analysis", category: "TECHNICAL" }
        ];

        const leaveTypes = [
            { name: "Sick Leave", code: "SL", length: "FULL", isPaid: true },
            { name: "Casual Leave", code: "CL", length: "FULL", isPaid: true },
            { name: "Annual Leave", code: "AL", length: "FULL", isPaid: true },
            { name: "Loss Of Pay", code: "LOP", length: "FULL", isPaid: false }
        ];

        // 1. Seed Departments
        console.log("\n--- Seeding Departments ---");
        let defaultDept = null;
        for (const d of departments) {
            let dept = await DepartmentModal.findOne({ name: d.name });
            if (!dept) {
                dept = await DepartmentModal.create(d);
                console.log(`Created Department: ${dept.name}`);
            } else {
                console.log(`Department already exists: ${dept.name}`);
            }
            if (d.name === "General Management") defaultDept = dept;
        }

        // 2. Seed Skills
        console.log("\n--- Seeding Skills ---");
        let defaultSkill = null;
        for (const s of skills) {
            let skill = await SkillModal.findOne({ name: s.name });
            if (!skill) {
                skill = await SkillModal.create(s);
                console.log(`Created Skill: ${skill.name}`);
            } else {
                console.log(`Skill already exists: ${skill.name}`);
            }
            if (s.name === "Administration") defaultSkill = skill;
        }

        // 3. Seed Leave Types
        console.log("\n--- Seeding Leave Types ---");
        const finalLeaveTypes = [];
        for (const lt of leaveTypes) {
            let leaveType = await LeaveTypeModal.findOne({ code: lt.code });
            if (!leaveType) {
                leaveType = await LeaveTypeModal.create(lt);
                console.log(`Created Leave Type: ${leaveType.name}`);
            } else {
                console.log(`Leave Type already exists: ${leaveType.name}`);
            }
            finalLeaveTypes.push(leaveType);
        }

        // Helper function to seed user related data (Balance, Salary, etc)
        const seedUserData = async (user, salaryData) => {
            if (!user) return;

            console.log(`\n--- Seeding Data for ${user.email} ---`);

            // Seed Salaries
            let salary = await SalariesModel.findOne({ userId: user._id });
            if (!salary) {
                salary = await SalariesModel.create({
                    userId: user._id,
                    base: salaryData.base,
                    hra: salaryData.hra,
                    lta: salaryData.lta
                });
                console.log(`Created Salary for: ${user.email}`);
            } else {
                console.log(`Salary already exists: ${user.email}`);
            }

            // Seed Leave Balances
            let balance = await LeaveBalanceModel.findOne({ user: user._id });
            if (!balance) {
                // Create balance with all leave types
                const leavesData = finalLeaveTypes.map(lt => ({
                    type: lt._id,
                    amount: 12 // Default 12 days
                }));

                balance = await LeaveBalanceModel.create({
                    user: user._id,
                    leaves: leavesData
                });
                console.log(`Created Leave Balance: ${user.email}`);
            } else {
                console.log(`Leave Balance already exists: ${user.email}`);
            }

            // Seed Attendance (Dummy check-in/out for today)
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            let attendance = await AttendanceModel.findOne({
                userId: user._id,
                timestamp: { $gte: todayStart }
            });

            if (!attendance) {
                // Check In
                await AttendanceModel.create({
                    userId: user._id,
                    type: "IN",
                    timestamp: new Date()
                });
                console.log(`Created Attendance (IN): ${user.email}`);
            } else {
                console.log(`Attendance already exists for today: ${user.email}`);
            }

            // Seed Payroll (Just one record)
            if (salary) {
                let payroll = await PayrollModal.findOne({ user: user._id });
                if (!payroll) {
                    await PayrollModal.create({
                        user: user._id,
                        salary: salary._id,
                        bonus: [],
                        deduction: []
                    });
                    console.log(`Created Payroll record: ${user.email}`);
                } else {
                    console.log(`Payroll record already exists: ${user.email}`);
                }
            }

            // Seed Leave Request (One pending request for employee)
            if (user.role === 'EMPLOYEE' && finalLeaveTypes.length > 0) {
                const sickLeave = finalLeaveTypes.find(lt => lt.code === 'SL') || finalLeaveTypes[0];
                // Check if pending request exists
                const existingRequest = await LeaveRequestModel.findOne({ requestedBy: user._id, status: 'PENDING' });

                if (!existingRequest) {
                    // Create a request for tomorrow
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(0, 0, 0, 0);

                    // Ensure balance exists (it should as we just seeded it)
                    try {
                        const newReq = await LeaveRequestModel.create({
                            requestedBy: user._id,
                            type: sickLeave._id,
                            quantity: 1,
                            from: tomorrow,
                            to: tomorrow,
                            status: "PENDING"
                        });
                        console.log(`Created Pending Leave Request for: ${user.email}`);
                    } catch (err) {
                        console.log(`Failed to create leave request: ${err.message}`);
                    }
                } else {
                    console.log(`Pending Leave Request already exists: ${user.email}`);
                }
            }
        };

        // 4. Create Admin (HR) User
        const adminEmail = "admin@nexushr.com";
        const adminPassword = "password123";
        let admin = await UserModel.findOne({ email: adminEmail });

        if (!admin) {
            admin = await UserModel.create({
                email: adminEmail,
                firstName: "Admin",
                lastName: "User",
                passwordHash: adminPassword,
                role: "HR",
                deptId: defaultDept?._id,
                skills: defaultSkill ? [defaultSkill._id] : [],
                note: "System Administrator",
                online: true
            });
            console.log(`\nCREATED ADMIN USER:\nEmail: ${adminEmail}\nPassword: ${adminPassword}\n`);
        } else {
            console.log("\nAdmin user already exists.");
        }

        // Seed Admin Data
        await seedUserData(admin, { base: 80000, hra: 30000, lta: 15000 });


        // 5. Create Employee User
        const employeeEmail = "employee@nexushr.com";
        const employeePassword = "password123";
        let employee = await UserModel.findOne({ email: employeeEmail });

        if (!employee) {
            employee = await UserModel.create({
                email: employeeEmail,
                firstName: "John",
                lastName: "Doe",
                passwordHash: employeePassword,
                role: "EMPLOYEE",
                deptId: defaultDept?._id,
                skills: defaultSkill ? [defaultSkill._id] : [],
                note: "Standard Employee",
                online: false
            });
            console.log(`\nCREATED EMPLOYEE USER:\nEmail: ${employeeEmail}\nPassword: ${employeePassword}\n`);
        } else {
            console.log("\nEmployee user already exists.");
        }

        // Seed Employee Data
        await seedUserData(employee, { base: 40000, hra: 15000, lta: 5000 });


        console.log("\nSeeding completed successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seed();
