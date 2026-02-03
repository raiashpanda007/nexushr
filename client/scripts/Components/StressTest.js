function Skills(number) {
    const skills = [];
    for (let i = 0; i < number; i++) {
        skills.push({
            id: crypto.randomUUID(),
            name: `Skill${i}`,
            category: `Category${i}`,
        });
    }
    return skills;
}

function Department() {
    const departments = [
        {
            id: crypto.randomUUID(),
            name: "HR",
            description: "Human Resources"
        },
        {
            id: crypto.randomUUID(),
            name: "Engineering",
            description: "Engineering"
        },
        {
            id: crypto.randomUUID(),
            name: "Marketing",
            description: "Marketing"
        },
        {
            id: crypto.randomUUID(),
            name: "Sales",
            description: "Sales"
        }
    ]
    const department = departments[Math.floor(Math.random() * departments.length)];
    return department;
}

class StressTest {
    constructor() {

    }

    StartStressTest() {
        const employees = [];
        for (let i = 0; i < 1000; i++) {
            employees.push({
                id: crypto.randomUUID(),
                email: `user${i}@example.com`,
                firstName: `FirstName${i}`,
                lastName: `LastName${i}`,
                password: `password${i}`,
                skills: Skills(Math.floor(Math.random() * 10)),
                profilePhoto: `https://i.pravatar.cc/150?u=${i}`,
                note: `Note ${i}`,
                department: Department(),
            });
        }
        return employees;
    }
}








export default StressTest