
export class LeaveCharts {
    static renderDepartmentChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (window.activeLeaveDeptChart instanceof Chart) {
            window.activeLeaveDeptChart.destroy();
        }

        const departments = data.map(d => d.name);

        const allLeaveTypes = new Set();
        data.forEach(d => {
            if (d.leaveTypeDays) {
                Object.keys(d.leaveTypeDays).forEach(k => allLeaveTypes.add(k));
            }
        });

        const typeArray = Array.from(allLeaveTypes);


        const palette = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(99, 102, 241, 0.8)',
            'rgba(249, 115, 22, 0.8)'
        ];

        const datasets = typeArray.map((type, index) => ({
            label: type,
            data: data.map(d => d.leaveTypeDays ? (d.leaveTypeDays[type] || 0) : 0),
            backgroundColor: palette[index % palette.length],
            stack: 'Stack 0'
        }));

        window.activeLeaveDeptChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: departments,
                datasets: datasets
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Total Leave Days by Department & Type'
                    },
                    tooltip: {
                        callbacks: {
                            footer: (tooltipItems) => {
                                let total = 0;
                                tooltipItems.forEach((tooltipItem) => {
                                    total += tooltipItem.parsed.y;
                                });
                                return 'Total Days: ' + total;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        title: {
                            display: true,
                            text: 'Departments'
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Days'
                        }
                    }
                }
            }
        });
    }

    /**
     * Renders a stacked bar chart showing leave days by employee and type.
     * @param {string} canvasId - The ID of the canvas element.
     * @param {Array} data - The array of employee data objects.
     */
    static renderEmployeeChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        if (window.activeLeaveEmpChart instanceof Chart) {
            window.activeLeaveEmpChart.destroy();
        }

        const chartData = data.slice(0, 20);
        const employees = chartData.map(d => d.name);

        const allLeaveTypes = new Set();
        chartData.forEach(d => {
            if (d.leaveTypes) {
                Object.keys(d.leaveTypes).forEach(k => allLeaveTypes.add(k));
            }
        });

        const typeArray = Array.from(allLeaveTypes);

        const palette = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(99, 102, 241, 0.8)',
            'rgba(249, 115, 22, 0.8)'
        ];

        const datasets = typeArray.map((type, index) => ({
            label: type,
            data: chartData.map(d => d.leaveTypes ? (d.leaveTypes[type] || 0) : 0),
            backgroundColor: palette[index % palette.length],
            stack: 'Stack 0'
        }));

        window.activeLeaveEmpChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: employees,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Leave Days by Employee & Type (Top 20)'
                    },
                    tooltip: {
                        callbacks: {
                            footer: (tooltipItems) => {
                                let total = 0;
                                tooltipItems.forEach((tooltipItem) => {
                                    total += tooltipItem.parsed.y;
                                });
                                return 'Total Days: ' + total;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Days'
                        }
                    }
                }
            }
        });
    }

    /**
     * Renders a stacked bar chart showing leave days by skill and type.
     * @param {string} canvasId - The ID of the canvas element.
     * @param {Array} data - The array of skill data objects.
     */
    static renderSkillChart(canvasId, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Destroy existing chart
        if (window.activeLeaveSkillChart instanceof Chart) {
            window.activeLeaveSkillChart.destroy();
        }

        const chartData = data;
        const skills = chartData.map(d => d.name);

        const allLeaveTypes = new Set();
        chartData.forEach(d => {
            if (d.leaveTypes) {
                Object.keys(d.leaveTypes).forEach(k => allLeaveTypes.add(k));
            }
        });

        const typeArray = Array.from(allLeaveTypes);

        // Same palette
        const palette = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(99, 102, 241, 0.8)',
            'rgba(249, 115, 22, 0.8)'
        ];

        const datasets = typeArray.map((type, index) => ({
            label: type,
            data: chartData.map(d => d.leaveTypes ? (d.leaveTypes[type] || 0) : 0),
            backgroundColor: palette[index % palette.length],
            stack: 'Stack 0'
        }));

        window.activeLeaveSkillChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: skills,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Leave Days by Skill & Type'
                    },
                    tooltip: {
                        callbacks: {
                            footer: (tooltipItems) => {
                                let total = 0;
                                tooltipItems.forEach((tooltipItem) => {
                                    total += tooltipItem.parsed.y;
                                });
                                return 'Total Days: ' + total;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Number of Days'
                        }
                    }
                }
            }
        });
    }
}
