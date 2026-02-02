export class AttendanceCharts {

    static _renderChart(canvasId, labels, regularData, overtimeData, title) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');


        let chartInstanceName = 'activeAttendanceChart_' + canvasId;

        if (window[chartInstanceName] instanceof Chart) {
            window[chartInstanceName].destroy();
        }

        window[chartInstanceName] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Regular Hours',
                        data: regularData,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)', // Green
                        stack: 'Stack 0'
                    },
                    {
                        label: 'Overtime Hours',
                        data: overtimeData,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
                        stack: 'Stack 0'
                    }
                ]
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
                        text: title
                    },
                    tooltip: {
                        callbacks: {
                            footer: (tooltipItems) => {
                                let total = 0;
                                tooltipItems.forEach((tooltipItem) => {
                                    total += tooltipItem.parsed.y;
                                });
                                return 'Total Hours: ' + total.toFixed(1);
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
                            text: 'Hours'
                        }
                    }
                }
            }
        });
    }

    static renderDepartmentChart(canvasId, data) {

        const labels = data.map(d => d.name);
        const regular = data.map(d => d.regularHours || 0);
        const overtime = data.map(d => d.overtimeHours || 0);

        this._renderChart(canvasId, labels, regular, overtime, 'Hours Worked by Department');
    }

    static renderEmployeeChart(canvasId, data) {
        const chartData = data.slice(0, 20);
        const labels = chartData.map(d => d.name);
        const regular = chartData.map(d => d.regularHours || 0);
        const overtime = chartData.map(d => d.overtimeHours || 0);

        this._renderChart(canvasId, labels, regular, overtime, 'Hours Worked by Employee (Top 20)');
    }

    static renderSkillChart(canvasId, data) {
        const labels = data.map(d => d.name);
        const regular = data.map(d => d.regularHours || 0);
        const overtime = data.map(d => d.overtimeHours || 0);

        this._renderChart(canvasId, labels, regular, overtime, 'Hours Worked by Skill');
    }
}
