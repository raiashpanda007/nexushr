import mongoose from "mongoose";
import { Cfg } from "./config/env.js";
import { UserModel } from "./modules/Users/models/users.models.js";
import { DepartmentModal } from "./modules/Departments/Models/departments.models.js";
import SkillModal from "./modules/Skills/models/skills.models.js";

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

        // 3. Create Admin (HR) User
        const adminEmail = "admin@nexushr.com";
        const adminPassword = "password123";
        let admin = await UserModel.findOne({ email: adminEmail });

        if (!admin) {
            // No need to manually hash, the model pre-save hook handles it
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

        // 4. Create Employee User
        const employeeEmail = "employee@nexushr.com";
        const employeePassword = "password123";
        let employee = await UserModel.findOne({ email: employeeEmail });

        if (!employee) {
            // No need to manually hash, the model pre-save hook handles it
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

        console.log("\nSeeding completed successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seed();
