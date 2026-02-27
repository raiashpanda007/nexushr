import mongoose from "mongoose";
import { Cfg } from "./config/env.js";
import UserModel from "./modules/Users/models/users.models.js";
import DepartmentModal from "./modules/Departments/Models/departments.models.js";
import SkillModal from "./modules/Skills/models/skills.models.js";
import LeaveTypeModal from "./modules/Leaves/LeaveTypes/Models/leavetypes.model.js";
import LeaveBalanceModel from "./modules/Leaves/LeavesBalances/Models/leavesBalances.model.js";
import LeaveRequestModel from "./modules/Leaves/LeaveRequests/Models/leaveRequests.model.js";
import SalariesModel from "./modules/Salaries/Models/salaries.model.js";
import AttendanceModel from "./modules/Attendance/Models/attendance.model.js";
import PayrollModal from "./modules/Payroll/Models/payroll.model.js";
import EventModel from "./modules/Events/Models/Events.models.js";

const seed = async () => {
    try {
        await mongoose.connect(Cfg.MONGO_DB_URL, { dbName: Cfg.DB_NAME });
        console.log("Connected to MongoDB for seeding...");


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
        const categories = ["MANAGEMENT", "TECHNICAL", "SOFT_SKILL"];


        const leaveTypes = [
            { name: "Sick Leave", code: "SL", length: "FULL", isPaid: true },
            { name: "Casual Leave", code: "CL", length: "FULL", isPaid: true },
            { name: "Annual Leave", code: "AL", length: "FULL", isPaid: true },
            { name: "Loss Of Pay", code: "LOP", length: "FULL", isPaid: false }
        ];


        // 1. Seed Departments
        console.log("\n--- Seeding Departments ---");
        const finalDepartments = [];
        for (const d of departments) {
            let dept = await DepartmentModal.findOne({ name: d.name });
            if (!dept) {
                dept = await DepartmentModal.create(d);
                console.log(`Created Department: ${dept.name}`);
            }
            finalDepartments.push(dept);
        }

        // 2. Seed Skills
        console.log("\n--- Seeding Skills ---");
        const finalSkills = [];
        for (const s of skills) {
            let skill = await SkillModal.findOne({ name: s.name });
            if (!skill) {
                skill = await SkillModal.create(s);
                console.log(`Created Skill: ${skill.name}`);
            }
            finalSkills.push(skill);
        }

        // 3. Seed Leave Types
        console.log("\n--- Seeding Leave Types ---");
        const finalLeaveTypes = [];
        for (const lt of leaveTypes) {
            let leaveType = await LeaveTypeModal.findOne({ code: lt.code });
            if (!leaveType) {
                leaveType = await LeaveTypeModal.create(lt);
                console.log(`Created Leave Type: ${leaveType.name}`);
            }
            finalLeaveTypes.push(leaveType);
        }

        // Utility: Generate Attendance Records for a user
        const generateAttendanceHistory = async (user) => {
            const today = new Date();
            // Generate attendance for the last 15 days
            for (let i = 1; i <= 15; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                date.setUTCHours(0, 0, 0, 0);

                // Skip weekends roughly
                if (date.getDay() === 0 || date.getDay() === 6) continue;

                const existingAttendance = await AttendanceModel.findOne({ user: user._id, date });
                if (!existingAttendance) {
                    // Randomize punches: IN around 9 AM +/- 1 hr
                    const inHour = 8 + Math.floor(Math.random() * 3);
                    const inMinute = Math.floor(Math.random() * 60);
                    const inTime = new Date(date);
                    inTime.setHours(inHour, inMinute, 0, 0);

                    // OUT around 5 PM +/- 2 hrs
                    const outHour = 16 + Math.floor(Math.random() * 4);
                    const outMinute = Math.floor(Math.random() * 60);
                    const outTime = new Date(date);
                    outTime.setHours(outHour, outMinute, 0, 0);

                    const punches = [
                        { type: 'IN', time: inTime },
                        { type: 'OUT', time: outTime }
                    ];

                    // Sometimes add a lunch break
                    if (Math.random() > 0.5) {
                        const lunchOut = new Date(date);
                        lunchOut.setHours(13, 0, 0, 0);
                        const lunchIn = new Date(date);
                        lunchIn.setHours(14, 0, 0, 0);
                        punches.splice(1, 0, { type: 'OUT', time: lunchOut }, { type: 'IN', time: lunchIn });
                    }

                    const diffMinutes = (outTime.getTime() - inTime.getTime()) / 60000;

                    await AttendanceModel.create({
                        user: user._id,
                        date,
                        punches,
                        totalMinutes: Math.floor(diffMinutes)
                    });
                }
            }
            console.log(`Generated ~15 days attendance for ${user.email}`);
        };

        const seedUserData = async (user, salaryData) => {
            if (!user) return;

            let salary = await SalariesModel.findOne({ userId: user._id });
            if (!salary) {
                salary = await SalariesModel.create({
                    userId: user._id,
                    base: salaryData.base,
                    hra: salaryData.hra,
                    lta: salaryData.lta
                });
            }

            let balance = await LeaveBalanceModel.findOne({ user: user._id });
            if (!balance) {
                const leavesData = finalLeaveTypes.map(lt => ({
                    type: lt._id,
                    amount: 15
                }));
                balance = await LeaveBalanceModel.create({
                    user: user._id,
                    leaves: leavesData
                });
            }

            // Generate dense attendance data
            await generateAttendanceHistory(user);

            // Generate Leave Request
            const selectedLeave = balance.leaves[Math.floor(Math.random() * balance.leaves.length)];
            const leaveTypeId = selectedLeave.type;
            const fromDate = new Date();
            fromDate.setUTCHours(0, 0, 0, 0);
            fromDate.setDate(fromDate.getDate() + 1);

            const toDate = new Date();
            toDate.setUTCHours(0, 0, 0, 0);
            toDate.setDate(toDate.getDate() + 2);

            let leaveReq = await LeaveRequestModel.findOne({ requestedBy: user._id });
            if (!leaveReq) {
                try {
                    await LeaveRequestModel.create({
                        requestedBy: user._id,
                        type: leaveTypeId,
                        quantity: 2,
                        from: fromDate,
                        to: toDate,
                        status: "PENDING"
                    });
                } catch (err) {
                    console.log(`Failed to create leave request for ${user.firstName}`, err.message);
                }
            }

            // Generate Payroll
            const currentDate = new Date();
            let payroll = await PayrollModal.findOne({ user: user._id, month: currentDate.getMonth() + 1, year: currentDate.getFullYear() });
            if (!payroll) {
                try {
                    await PayrollModal.create({
                        user: user._id,
                        bonus: [{ reason: "Performance", amount: 1000 }],
                        deduction: [{ reason: "Tax", amount: 500 }],
                        salary: salary._id,
                        month: currentDate.getMonth() + 1,
                        year: currentDate.getFullYear()
                    });
                } catch (err) {
                    console.log(`Failed to create payroll for ${user.firstName}`, err.message);
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
                deptId: finalDepartments.find(d => d.name === "Human Resources")?._id,
                skills: finalSkills.slice(0, 2).map(s => s._id),
                online: true
            });
            console.log(`\nCREATED ADMIN USER: ${adminEmail}`);
        }
        await seedUserData(admin, { base: 80000, hra: 30000, lta: 15000 });

        // 5. Create 50 Employees for realistic data
        console.log("\n--- Seeding 50 Employees ---");
        const employees = [
            { first: "Alice", last: "Smith", dept: "Engineering" },
            { first: "Bob", last: "Johnson", dept: "Engineering" },
            { first: "Charlie", last: "Brown", dept: "Marketing" },
            { first: "Diana", last: "Prince", dept: "Sales" },
            { first: "Evan", last: "Wright", dept: "Finance" },
            { first: "Fiona", last: "Gallagher", dept: "Marketing" },
            { first: "George", last: "Miller", dept: "Sales" },
            { first: "Hannah", last: "Abbott", dept: "Engineering" },
            { first: "Ian", last: "Malcolm", dept: "General Management" },
            { first: "Julia", last: "Roberts", dept: "Finance" }
        ];
        for (let i = employees.length + 1; i <= 50; i++) {
            employees.push({ first: `EmployeeFirst${i}`, last: `EmployeeLast${i}`, dept: departments[i % departments.length].name });
        }

        for (let i = 0; i < employees.length; i++) {
            const emp = employees[i];
            const email = `${emp.first.toLowerCase()}.${emp.last.toLowerCase()}@nexushr.com`;
            let user = await UserModel.findOne({ email });

            if (!user) {
                const dept = finalDepartments.find(d => d.name === emp.dept) || finalDepartments[0];
                const empSkills = [finalSkills[i % finalSkills.length]._id, finalSkills[(i + 1) % finalSkills.length]._id];

                user = await UserModel.create({
                    email,
                    firstName: emp.first,
                    lastName: emp.last,
                    passwordHash: "password123",
                    role: "EMPLOYEE",
                    deptId: dept._id,
                    skills: empSkills,
                    online: false
                });
                console.log(`Created Employee: ${email}`);
            }

            await seedUserData(user, { base: 40000 + (Math.random() * 20000), hra: 15000, lta: 5000 });
        }

        // 6. Seed Events
        console.log("\n--- Seeding Events ---");
        const eventsData = [
            { name: "Annual General Meeting", description: "Company-wide annual meeting", type: "MEETING", forAll: true, time: "10:00 AM", daysFromNow: 5 },
            { name: "New Year's Day", description: "Public Holiday", type: "HOLIDAY", forAll: true, time: "00:00 AM", daysFromNow: 300 },
            { name: "Project Kickoff", description: "Kickoff for new Q3 project", type: "MEETING", forAll: false, time: "02:00 PM", daysFromNow: 2, deptName: "Engineering" },
            { name: "Marketing Strategy alignment", description: "Discussing new ad campaigns", type: "MEETING", forAll: false, time: "11:30 AM", daysFromNow: 4, deptName: "Marketing" },
            { name: "Sales Quarterly Review", description: "Review of Q2 sales", type: "MEETING", forAll: false, time: "03:00 PM", daysFromNow: 6, deptName: "Sales" },
            { name: "Alice's Birthday", description: "Happy Birthday Alice", type: "BIRTHDAY", forAll: true, time: "05:00 PM", daysFromNow: 1 },
            { name: "Company Retreat", description: "Annual company retreat", type: "OTHER", forAll: true, time: "09:00 AM", daysFromNow: 30 },
            { name: "Bob's 5th Work Anniversary", description: "Celebrating 5 years", type: "ANNIVERSARY", forAll: true, time: "04:00 PM", daysFromNow: 8 },
            { name: "Town Hall", description: "Monthly town hall meeting", type: "MEETING", forAll: true, time: "01:00 PM", daysFromNow: 12 },
            { name: "Finance Audit Prep", description: "Preparation for upcoming audit", type: "MEETING", forAll: false, time: "10:00 AM", daysFromNow: 3, deptName: "Finance" },
            { name: "Independence Day", description: "Public Holiday", type: "HOLIDAY", forAll: true, time: "00:00 AM", daysFromNow: 150 },
            { name: "Christmas Party", description: "End of year celebration", type: "OTHER", forAll: true, time: "07:00 PM", daysFromNow: -60 },
            { name: "Tech Talk", description: "New frontend framework discussion", type: "MEETING", forAll: false, time: "04:30 PM", daysFromNow: -2, deptName: "Engineering" },
            { name: "Charlie's Birthday", description: "Happy Birthday Charlie", type: "BIRTHDAY", forAll: true, time: "05:00 PM", daysFromNow: 14 },
            { name: "Leadership Offsite", description: "Strategic planning", type: "MEETING", forAll: false, time: "09:00 AM", daysFromNow: -10, deptName: "General Management" },
            { name: "Labor Day", description: "Public Holiday", type: "HOLIDAY", forAll: true, time: "00:00 AM", daysFromNow: -150 },
            { name: "HR Policies Review", description: "Updating employee handbook", type: "MEETING", forAll: false, time: "11:00 AM", daysFromNow: 7, deptName: "Human Resources" },
            { name: "Thanksgiving Break", description: "Company holiday", type: "HOLIDAY", forAll: true, time: "00:00 AM", daysFromNow: -90 },
            { name: "Product Launch", description: "V2.0 Product Launch Event", type: "OTHER", forAll: true, time: "10:00 AM", daysFromNow: 20 },
            { name: "Diana's 1st Work Anniversary", description: "Celebrating 1 year", type: "ANNIVERSARY", forAll: true, time: "04:00 PM", daysFromNow: 25 },
            { name: "Emergency Maintenance", description: "Server downtime", type: "OTHER", forAll: false, time: "01:00 AM", daysFromNow: -1, deptName: "Engineering" },
            { name: "All Hands", description: "Quarterly all hands sync", type: "MEETING", forAll: true, time: "12:00 PM", daysFromNow: -5 }
        ];

        for (const ev of eventsData) {
            let existingEvent = await EventModel.findOne({ name: ev.name });
            if (!existingEvent) {
                const eventDate = new Date();
                eventDate.setDate(eventDate.getDate() + ev.daysFromNow);
                eventDate.setUTCHours(0, 0, 0, 0);

                const eventPayload = {
                    name: ev.name,
                    description: ev.description,
                    type: ev.type,
                    forAll: ev.forAll,
                    time: ev.time,
                    date: eventDate,
                    respectedToDepartments: [],
                    resepectedEmplooyees: []
                };

                if (ev.deptName) {
                    const dpt = finalDepartments.find(d => d.name === ev.deptName);
                    if (dpt) {
                        eventPayload.respectedToDepartments.push(dpt._id);
                    }
                }

                await EventModel.create(eventPayload);
                console.log(`Created Event: ${ev.name}`);
            }
        }

        console.log("\nSeeding completed successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seed();
