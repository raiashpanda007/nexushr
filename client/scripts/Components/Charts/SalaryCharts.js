export class SalaryCharts {

    static _renderChart(canvasId, labels, baseData, hraData, ltaData, title) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Ensure unique chart instance per canvas to avoid conflicts
        const chartInstanceName = 'activeSalaryChart_' + canvasId;

        if (window[chartInstanceName] instanceof Chart) {
            window[chartInstanceName].destroy();
        }

        window[chartInstanceName] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Base Salary',
                        data: baseData,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)', // Blue
                        stack: 'Stack 0'
                    },
                    {
                        label: 'HRA',
                        data: hraData,
                        backgroundColor: 'rgba(16, 185, 129, 0.8)', // Green
                        stack: 'Stack 0'
                    },
                    {
                        label: 'LTA',
                        data: ltaData,
                        backgroundColor: 'rgba(245, 158, 11, 0.8)', // Amber
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
                                return 'Total Cost: ' + total.toLocaleString();
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
                            text: 'Amount ($)'
                        }
                    }
                }
            }
        });
    }

    static renderDepartmentChart(canvasId, data) {
        // Data is array of objects with name, components: {Base, HRA, LTA}
        const labels = data.map(d => d.name);
        const base = data.map(d => d.components?.Base || 0);
        const hra = data.map(d => d.components?.HRA || 0);
        const lta = data.map(d => d.components?.LTA || 0);

        this._renderChart(canvasId, labels, base, hra, lta, 'Salary Distribution by Department');
    }

    static renderEmployeeChart(canvasId, data) {
        // Limit to top 20 by total cost
        const chartData = data.slice(0, 20);
        const labels = chartData.map(d => d.name);
        const base = chartData.map(d => d.components?.Base || 0);
        const hra = chartData.map(d => d.components?.HRA || 0);
        const lta = chartData.map(d => d.components?.LTA || 0);

        this._renderChart(canvasId, labels, base, hra, lta, 'Salary Distribution by Employee (Top 20)');
    }

    static renderSkillChart(canvasId, data) {
        const labels = data.map(d => d.name);
        const base = data.map(d => d.components?.Base || 0);
        const hra = data.map(d => d.components?.HRA || 0);
        const lta = data.map(d => d.components?.LTA || 0);

        this._renderChart(canvasId, labels, base, hra, lta, 'Salary Distribution by Skill');
    }
}
