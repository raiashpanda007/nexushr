import mongoose from "mongoose";
import { Cfg } from "./config/env.js";
import { UserModel } from "./modules/Users/users.models.js";
import { DepartmentModal } from "./modules/Departments/departments.models.js";
import { SkillModal } from "./modules/Skills/skills.models.js";

const seed = async () => {
    try {
        await mongoose.connect(Cfg.MONGO_DB_URL, { dbName: Cfg.DB_NAME });
        console.log("Connected to MongoDB for seeding...");

        // 1. Ensure a Department exists
        let dept = await DepartmentModal.findOne({ name: "General Management" });
        if (!dept) {
            dept = await DepartmentModal.create({
                name: "General Management",
                description: "Default department for administrative staff"
            });
            console.log("Created default Department:", dept.name);
        } else {
            console.log("Department already exists:", dept.name);
        }

        // 2. Ensure a Skill exists
        let skill = await SkillModal.findOne({ name: "Administration" });
        if (!skill) {
            skill = await SkillModal.create({
                name: "Administration",
                category: "MANAGEMENT"
            });
            console.log("Created default Skill:", skill.name);
        } else {
            console.log("Skill already exists:", skill.name);
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
                deptId: dept._id,
                skills: [skill._id],
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
                deptId: dept._id,
                skills: [skill._id],
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
