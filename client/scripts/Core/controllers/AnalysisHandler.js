const ANALYSIS_BY = {
    "DEPARTMENT": "department",
    "EMPLOYEE": "employee",
    "SKILL": "skill",
}

class AnalysisHandler {
    constructor(LeaveHandler, AttendanceHandler, SalariesHandler, UserHandler, SkillHandler, DepartmentHandler, authState) {
        this.leaveHandler = LeaveHandler;
        this.attendanceHandler = AttendanceHandler;
        this.salariesHandler = SalariesHandler;
        this.userHandler = UserHandler;
        this.skillHandler = SkillHandler;
        this.departmentHandler = DepartmentHandler;
        this.user = authState;
    }

    async LeaveAnalysis(analysisBy, startDate, endDate, filterTarget) {
        if (!this.user || this.user.data.user.role != "HR") {
            return { ok: false, data: "Unauthorized" }
        }

        const leaveApplicationsResponse = await this.leaveHandler.fetchAllLeaveApplications();
        const getAllUsers = await this.userHandler.GetAllUser();
        const getAllSkills = await this.skillHandler.GetAllSkills();
        const getAllDepartments = await this.departmentHandler.GetAllDepartments();

        const result = this._processLeaveAnalysis(
            leaveApplicationsResponse.data,
            getAllUsers.data ? (getAllUsers.data.data || getAllUsers.data) : [],
            getAllSkills.data,
            getAllDepartments.data,
            analysisBy,
            startDate,
            endDate,
            filterTarget
        );

        return { ok: true, data: result }
    }

    async AttendanceAnalysis(analysisBy, startDate, endDate, filterTarget) {
        if (!this.user || this.user.data.user.role != "HR") {
            return { ok: false, data: "Unauthorized" }
        }

        const attendanceResponse = await this.attendanceHandler.GetAllAttendance();
        const getAllUsers = await this.userHandler.GetAllUser();
        const getAllSkills = await this.skillHandler.GetAllSkills();
        const getAllDepartments = await this.departmentHandler.GetAllDepartments();

        if (!attendanceResponse.ok) return { ok: false, data: attendanceResponse.data };

        const result = this._processAttendanceAnalysis(
            attendanceResponse.data,
            getAllUsers.data ? (getAllUsers.data.data || getAllUsers.data) : [],
            getAllSkills.data,
            getAllDepartments.data,
            analysisBy,
            startDate,
            endDate,
            filterTarget
        );

        return { ok: true, data: result }
    }

    async SalariesAnalysis(analysisBy, startDate, endDate, filterTarget) {
        if (!this.user || this.user.data.user.role != "HR") {
            return { ok: false, data: "Unauthorized" }
        }

        const salariesResponse = await this.salariesHandler.GetAllSalaries();
        const getAllUsers = await this.userHandler.GetAllUser();
        const getAllSkills = await this.skillHandler.GetAllSkills();
        const getAllDepartments = await this.departmentHandler.GetAllDepartments();

        if (!salariesResponse.ok) return { ok: false, data: salariesResponse.data };

        const result = this._processSalariesAnalysis(
            salariesResponse.data,
            getAllUsers.data ? (getAllUsers.data.data || getAllUsers.data) : [],
            getAllSkills.data,
            getAllDepartments.data,
            analysisBy,
            startDate,
            endDate,
            filterTarget
        );

        return { ok: true, data: result }
    }

    // --- Helper Methods ---

    _getDays(start, end) {
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e - s);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    _filterByDate(data, dateField, start, end) {
        if (!start || !end) return data;
        const s = new Date(start).getTime();
        const e = new Date(end).getTime();
        return data.filter(item => {
            const d = new Date(item[dateField]).getTime();
            return d >= s && d <= e;
        });
    }

    _filterData(data, type, filterTarget) {
        if (!filterTarget) return data;

        return data.filter(item => {
            if (type === 'department') return item.departmentName === filterTarget;
            if (type === 'employee') return item.userId === filterTarget; // Assuming filterTarget is UserID for employee
            if (type === 'skill') return (item.userSkills || []).includes(filterTarget); // Assuming filterTarget is SkillID
            return true;
        });
    }

    _processLeaveAnalysis(leaves, users, skills, departments, type, startDate, endDate, filterTarget) {
        let filteredLeaves = leaves;
        if (startDate && endDate) {
            filteredLeaves = this._filterByDate(leaves, 'startDate', startDate, endDate);
        }

        const userMap = new Map((users || []).map(u => [u.id, u]));
        const deptMap = new Map((departments || []).map(d => [d.id, d.name]));
        const skillMap = new Map((skills || []).map(s => [s.id, s.name]));

        let enrichedLeaves = filteredLeaves.map(l => {
            const user = userMap.get(l.userId);
            return {
                ...l,
                days: this._getDays(l.startDate, l.endDate),
                departmentName: user?.department?.name || deptMap.get(user?.department) || 'Unknown',
                userSkills: user?.skills || [],
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
            };
        });

        // Apply Generic Filter
        if (filterTarget) {
            enrichedLeaves = this._filterData(enrichedLeaves, type, filterTarget);
        }

        const totalLeavesApplied = enrichedLeaves.length;
        const acceptedLeaves = enrichedLeaves.filter(l => l.status === 'Accepted');
        const rejectedLeaves = enrichedLeaves.filter(l => l.status === 'Rejected');
        const pendingLeaves = enrichedLeaves.filter(l => l.status === 'Pending');

        const totalLeavesTaken = acceptedLeaves.reduce((acc, curr) => acc + curr.days, 0);
        const avgLeaveDuration = acceptedLeaves.length ? (totalLeavesTaken / acceptedLeaves.length).toFixed(1) : 0;

        const mainSummary = {
            totalApplications: totalLeavesApplied,
            approvedLeaves: acceptedLeaves.length,
            rejectedLeaves: rejectedLeaves.length,
            pendingRequests: pendingLeaves.length,
            approvalRate: totalLeavesApplied ? Math.round((acceptedLeaves.length / totalLeavesApplied) * 100) + '%' : '0%',
            totalDaysTaken: totalLeavesTaken,
            avgDuration: avgLeaveDuration + ' days'
        };

        if (type === 'department') {
            const deptStats = {};
            acceptedLeaves.forEach(l => {
                const dName = l.departmentName;
                if (!deptStats[dName]) deptStats[dName] = { totalDays: 0, leaveTypes: {}, name: dName, employees: new Set() };
                deptStats[dName].totalDays += l.days;

                // Track employees in this dept who took leave
                deptStats[dName].employees.add(l.userName);

                const lType = l.leaveType || 'Other';
                deptStats[dName].leaveTypes[lType] = (deptStats[dName].leaveTypes[lType] || 0) + 1;
            });

            // Format for chart: { name, days, employeesCount }
            const deptArray = Object.values(deptStats).map(d => ({
                ...d,
                employeeCount: d.employees.size
            })).sort((a, b) => b.totalDays - a.totalDays);

            // Highlights Logic
            const deptMostLeaves = deptArray[0];

            let mostCommonType = null;
            let leastCommonType = null;
            let topLeaverInTargetDept = null;
            let leastLeaverInTargetDept = null;

            if (filterTarget && deptMostLeaves) {
                // Enhanced highlights for a specific department view
                // 1. Most common leave type
                const sortedTypes = Object.entries(deptMostLeaves.leaveTypes).sort((a, b) => b[1] - a[1]);
                mostCommonType = sortedTypes[0] ? { type: sortedTypes[0][0], count: sortedTypes[0][1] } : null;
                leastCommonType = sortedTypes[sortedTypes.length - 1] ? { type: sortedTypes[sortedTypes.length - 1][0], count: sortedTypes[sortedTypes.length - 1][1] } : null;

                // 2. Who took most leaves in this dept
                const usersInDept = acceptedLeaves.filter(l => l.departmentName === filterTarget);
                const userCount = {};
                usersInDept.forEach(l => {
                    userCount[l.userName] = (userCount[l.userName] || 0) + l.days;
                });
                const sortedUsers = Object.entries(userCount).sort((a, b) => b[1] - a[1]); // [name, days]
                topLeaverInTargetDept = sortedUsers[0] ? { name: sortedUsers[0][0], days: sortedUsers[0][1] } : null;
                leastLeaverInTargetDept = sortedUsers[sortedUsers.length - 1] ? { name: sortedUsers[sortedUsers.length - 1][0], days: sortedUsers[sortedUsers.length - 1][1] } : null;
            }

            const highlights = {
                departmentWithMostLeaves: deptMostLeaves ? { name: deptMostLeaves.name, days: deptMostLeaves.totalDays } : null,
            };

            if (filterTarget) {
                highlights['mostCommonLeaveType'] = mostCommonType;
                highlights['leastCommonLeaveType'] = leastCommonType;
                highlights['employeeWithMostLeaves'] = topLeaverInTargetDept;
                highlights['employeeWithLeastLeaves'] = leastLeaverInTargetDept;
            } else {
                // Global highlights
                // Find global most common type
                const globalTypes = {};
                acceptedLeaves.forEach(l => {
                    const t = l.leaveType || 'Other';
                    globalTypes[t] = (globalTypes[t] || 0) + 1;
                });
                const sortedGlobal = Object.entries(globalTypes).sort((a, b) => b[1] - a[1]);
                if (sortedGlobal.length > 0) highlights['globalMostCommonLeaveType'] = { type: sortedGlobal[0][0], count: sortedGlobal[0][1] };
            }

            return {
                summary: mainSummary,
                highlights: highlights,
                details: deptArray
            };
        }

        if (type === 'employee') {
            const userStats = {};
            acceptedLeaves.forEach(l => {
                const uName = l.userName;
                if (!userStats[uName]) userStats[uName] = { totalDays: 0, name: uName, dept: l.departmentName, leaveTypes: {} };
                userStats[uName].totalDays += l.days;

                const lType = l.leaveType || 'Other';
                userStats[uName].leaveTypes[lType] = (userStats[uName].leaveTypes[lType] || 0) + l.days;

                // Track Last Leave
                if (!userStats[uName].lastLeaveDate || new Date(l.startDate) > new Date(userStats[uName].lastLeaveDate)) {
                    userStats[uName].lastLeaveDate = l.startDate;
                }
            });

            const userArray = Object.values(userStats).sort((a, b) => b.totalDays - a.totalDays);

            return {
                summary: mainSummary,
                highlights: {
                    topLeaver: userArray[0] ? { name: userArray[0].name, days: userArray[0].totalDays } : null,
                },
                details: userArray
            };
        }

        if (type === 'skill') {
            const skillStats = {};
            acceptedLeaves.forEach(l => {
                l.userSkills.forEach(sId => {
                    const sName = skillMap.get(sId) || 'Unknown Skill';
                    if (!skillStats[sName]) skillStats[sName] = { totalDays: 0, name: sName };
                    skillStats[sName].totalDays += l.days;
                });
            });
            const skillArray = Object.values(skillStats).sort((a, b) => b.totalDays - a.totalDays);
            return {
                summary: mainSummary,
                details: skillArray
            };
        }
        return { data: enrichedLeaves };
    }

    _processAttendanceAnalysis(attendance, users, skills, departments, type, startDate, endDate, filterTarget) {
        let filteredAttendance = attendance;
        if (startDate && endDate) {
            filteredAttendance = this._filterByDate(attendance, 'entryDate', startDate, endDate);
        }

        const userMap = new Map((users || []).map(u => [u.id, u]));
        const deptMap = new Map((departments || []).map(d => [d.id, d.name]));
        const skillMap = new Map((skills || []).map(s => [s.id, s.name]));

        let enrichedAttendance = filteredAttendance.map(a => {
            const user = userMap.get(a.userId);
            let hours = 0;
            if (a.entryDate && a.exitDate) {
                hours = (new Date(a.exitDate) - new Date(a.entryDate)) / (1000 * 60 * 60);
            }
            return {
                ...a,
                hours,
                departmentName: user?.department?.name || deptMap.get(user?.department) || 'Unknown',
                userSkills: user?.skills || [],
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
            };
        });

        if (filterTarget) {
            enrichedAttendance = this._filterData(enrichedAttendance, type, filterTarget);
        }

        const totalHours = enrichedAttendance.reduce((acc, curr) => acc + curr.hours, 0);
        const totalRecords = enrichedAttendance.length;

        // Advanced metrics
        const avgHours = totalRecords ? (totalHours / totalRecords).toFixed(2) : 0;
        const overtimeRecords = enrichedAttendance.filter(a => a.hours > 9).length;
        const shortDays = enrichedAttendance.filter(a => a.hours < 4).length; // Half day assumption

        const mainSummary = {
            totalAttendanceRecords: totalRecords,
            totalHoursLogged: totalHours.toFixed(2),
            avgHoursPerShift: avgHours,
            overtimeShifts: overtimeRecords,
            shortShifts: shortDays
        };

        if (type === 'department') {
            const deptStats = {};
            enrichedAttendance.forEach(a => {
                const dName = a.departmentName;
                if (!deptStats[dName]) deptStats[dName] = { totalHours: 0, count: 0, overtime: 0, name: dName };
                deptStats[dName].totalHours += a.hours;
                deptStats[dName].count += 1;
                if (a.hours > 9) deptStats[dName].overtime += 1;
            });
            const deptArray = Object.values(deptStats).map(d => ({
                ...d, avgHours: d.count ? (d.totalHours / d.count).toFixed(2) : 0
            })).sort((a, b) => b.avgHours - a.avgHours);

            return {
                summary: mainSummary,
                highlights: {
                    highestAvgHoursDept: deptArray[0] ? { name: deptArray[0].name, avg: deptArray[0].avgHours } : null,
                    deptWithMostOvertime: [...deptArray].sort((a, b) => b.overtime - a.overtime)[0] || null
                },
                details: deptArray
            }
        }

        return { summary: mainSummary, details: enrichedAttendance };
    }

    _processSalariesAnalysis(salaries, users, skills, departments, type, startDate, endDate, filterTarget) {

        let filteredSalaries = salaries;

        const userMap = new Map((users || []).map(u => [u.id, u]));
        const deptMap = new Map((departments || []).map(d => [d.id, d.name]));
        const skillMap = new Map((skills || []).map(s => [s.id, s.name]));

        let enrichedSalaries = filteredSalaries.map(s => {
            const user = userMap.get(s.userId);
            const total = parseFloat(s.base || 0) + parseFloat(s.hra || 0) + parseFloat(s.lta || 0);
            return {
                ...s,
                total,
                departmentName: user?.department?.name || deptMap.get(user?.department) || 'Unknown',
                userSkills: user?.skills || [],
                userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown'
            };
        });

        if (filterTarget) {
            enrichedSalaries = this._filterData(enrichedSalaries, type, filterTarget);
        }

        const totalPayroll = enrichedSalaries.reduce((acc, curr) => acc + curr.total, 0);
        const mainSummary = {
            totalPayrollCost: totalPayroll.toLocaleString(),
            avgSalary: enrichedSalaries.length ? (totalPayroll / enrichedSalaries.length).toFixed(0).toLocaleString() : 0,
            totalEmployeesProcessed: enrichedSalaries.length,
            minSalary: enrichedSalaries.length ? Math.min(...enrichedSalaries.map(s => s.total)).toLocaleString() : 0,
            maxSalary: enrichedSalaries.length ? Math.max(...enrichedSalaries.map(s => s.total)).toLocaleString() : 0
        };

        if (type === 'department') {
            const deptStats = {};
            enrichedSalaries.forEach(s => {
                const dName = s.departmentName;
                if (!deptStats[dName]) deptStats[dName] = { totalCost: 0, count: 0, name: dName };
                deptStats[dName].totalCost += s.total;
                deptStats[dName].count += 1;
            });
            const deptArray = Object.values(deptStats).map(d => ({
                ...d, avgCost: d.count ? (d.totalCost / d.count).toFixed(0) : 0
            })).sort((a, b) => b.totalCost - a.totalCost);

            return {
                summary: mainSummary,
                highlights: {
                    highestCostDept: deptArray[0] ? { name: deptArray[0].name, cost: deptArray[0].totalCost.toLocaleString() } : null
                },
                details: deptArray
            }
        }

        return { summary: mainSummary, details: enrichedSalaries };
    }
}

export default AnalysisHandler;