
export const seedOnUpgrade = (transaction) => {
    console.log("Seeding database on upgrade...");

    // 1. Departments (at least 5)
    // We create these using the transaction passed from onupgradeneeded
    const departments = [
        { name: "Engineering", description: "Software Development & IT" },
        { name: "Human Resources", description: "Employee Relations & Recruitment" },
        { name: "Sales", description: "Revenue Generation & Client Management" },
        { name: "Marketing", description: "Brand Strategy & promotion" },
        { name: "Finance", description: "Accounting & Financial Planning" },
        { name: "Operations", description: "Daily Business Operations" }
    ];

    const departmentObjects = [];
    const deptStore = transaction.objectStore("departments");

    departments.forEach(dept => {
        const id = crypto.randomUUID();
        const deptObj = {
            id,
            name: dept.name,
            description: dept.description,
            empCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        departmentObjects.push(deptObj);
        deptStore.add(deptObj);
    });

    // 2. Skills (at least 5)
    const skills = [
        { name: "JavaScript", category: "Technical" },
        { name: "Python", category: "Technical" },
        { name: "React", category: "Frontend" },
        { name: "Node.js", category: "Backend" },
        { name: "Communication", category: "Soft Skills" },
        { name: "Leadership", category: "Management" }
    ];

    const skillObjects = [];
    const skillStore = transaction.objectStore("skills");

    skills.forEach(skill => {
        const id = crypto.randomUUID();
        const skillObj = {
            id,
            name: skill.name,
            category: skill.category,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        skillObjects.push(skillObj);
        skillStore.add(skillObj);
    });

    // 3. Leave Types (at least 5)
    const leaveTypes = [
        { code: "CL", name: "Casual Leave", length: 12 },
        { code: "SL", name: "Sick Leave", length: 12 },
        { code: "PL", name: "Privilege Leave", length: 18 },
        { code: "ML", name: "Maternity Leave", length: 180 },
        { code: "WFH", name: "Work From Home", length: 30 }
    ];

    const leaveTypeStore = transaction.objectStore("leave_types");

    leaveTypes.forEach(lt => {
        const id = crypto.randomUUID();
        leaveTypeStore.add({
            id,
            code: lt.code,
            name: lt.name,
            length: lt.length
        });
    });

    // 4. Employees (at least 5)
    // Admin is already created in startup.js, so we add 5 additional employees.
    const userStore = transaction.objectStore("users");
    const userIds = [];
    const createdUsers = [];

    for (let i = 1; i <= 5; i++) {
        const email = `employee${i}@nexus.com`;
        const firstName = "Employee";
        const lastName = `${i}`;
        const password = "12345678";

        // Assign random department object
        const deptObj = departmentObjects.length > 0 ? departmentObjects[i % departmentObjects.length] : null;

        // Assign some skill objects (random 2)
        const userSkills = [];
        if (skillObjects.length > 0) {
            userSkills.push(skillObjects[i % skillObjects.length]);
            if (skillObjects.length > 1) {
                userSkills.push(skillObjects[(i + 1) % skillObjects.length]);
            }
        }


        const id = crypto.randomUUID();
        // Capture user ID for attendance seeding
        userIds.push(id);

        const userObj = {
            id,
            email,
            firstName,
            lastName,
            password,
            role: "EMP", // Regular employee role
            department: deptObj, // Store full object
            skills: userSkills, // Store full objects
            profilePhoto: "",
            note: "Seeded Employee",
            online: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        createdUsers.push(userObj);
        userStore.add(userObj);
    }

    // 5. Attendance (Entry/Exit for past 5 days for seeded users)
    const attendanceStore = transaction.objectStore("attendance");
    const now = new Date();

    userIds.forEach(userId => {
        for (let d = 5; d >= 0; d--) { // Last 5 days + today
            const date = new Date(now);
            date.setDate(date.getDate() - d);

            // Randomize times slightly
            // Entry around 9:00 AM +/- 30 mins
            const entryTime = new Date(date);
            entryTime.setHours(9, Math.floor(Math.random() * 60), 0, 0);

            // Exit around 6:00 PM +/- 30 mins
            const exitTime = new Date(date);
            exitTime.setHours(18, Math.floor(Math.random() * 60), 0, 0);

            // Skip weekends nicely (0 = Sunday, 6 = Saturday)
            const dayOfWeek = entryTime.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) continue;

            // Add Entry
            attendanceStore.add({
                id: crypto.randomUUID(),
                userId: userId,
                type: "ENTRY",
                entryDate: entryTime.toISOString(),
                createdAt: entryTime.toISOString()
            });

            // Add Exit
            attendanceStore.add({
                id: crypto.randomUUID(),
                userId: userId,
                type: "EXIT",
                exitDate: exitTime.toISOString(), // AttendanceRepo Create logic uses exitDate for EXIT type
                createdAt: exitTime.toISOString()
            });
        }
    });

    console.log("Database preseeding completed.");

    // 6. Leave Applications (Seeding requests)
    const leaveAppStore = transaction.objectStore("leaves_applications");
    const statuses = ["Pending", "Accepted", "Rejected"];

    // Create 10 leave applications randomly across the seeded users
    for (let i = 0; i < 10; i++) {
        const userId = userIds[Math.floor(Math.random() * userIds.length)];
        // Pick a random leave type
        const leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];

        // Random dates in the future or recent past
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30) - 10); // -10 to +20 days from now

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 5) + 1); // 1 to 5 days duration

        const id = crypto.randomUUID();
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        leaveAppStore.add({
            id: id,
            leaveType: leaveType.code,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            reason: "Seeded leave application for testing purposes.",
            userId: userId,
            status: status,
            appliedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    console.log("Leave applications seeded.");

    const salaryStore = transaction.objectStore("salaries");


    createdUsers.forEach(user => {
        const id = crypto.randomUUID();
        // Random salary data
        const base = Math.floor(Math.random() * (100000 - 30000) + 30000); // 30k to 100k
        const hra = Math.floor(base * 0.4); // 40% of base
        const lta = Math.floor(base * 0.1); // 10% of base

        const userDeptName = user.department ? user.department.name : "";

        salaryStore.add({
            id,
            base,
            hra,
            lta,
            userId: user.id,
            userFirstName: user.firstName,
            userLastName: user.lastName,
            userDepartment: userDeptName,
            createdAt: new Date().toISOString(),
        });
    });

    console.log("Salaries seeded.");
};
