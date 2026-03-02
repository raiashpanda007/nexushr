import { ChartJSNodeCanvas } from "chartjs-node-canvas";

// ─── colour palette ───────────────────────────────────────────────────────────
const PALETTE = {
    blue:        "rgba(37,  99,  235, 0.85)",
    blueLight:   "rgba(37,  99,  235, 0.25)",
    green:       "rgba(16,  185, 129, 0.85)",
    greenLight:  "rgba(16,  185, 129, 0.25)",
    amber:       "rgba(245, 158,  11, 0.85)",
    amberLight:  "rgba(245, 158,  11, 0.25)",
    red:         "rgba(239,  68,  68, 0.85)",
    redLight:    "rgba(239,  68,  68, 0.25)",
    purple:      "rgba(139,  92, 246, 0.85)",
    indigo:      "rgba(99,  102, 241, 0.85)",
    pink:        "rgba(236,  72, 153, 0.85)",
    teal:        "rgba(20,  184, 166, 0.85)",
    orange:      "rgba(249, 115,  22, 0.85)",
    slate:       "rgba(100, 116, 139, 0.85)",
};

const PIE_COLORS = Object.values(PALETTE);

const FONT = "Helvetica";

const GLOBAL_DEFAULTS = {
    responsive: false,
    animation: false,
    plugins: {
        legend: {
            labels: {
                font: { family: FONT, size: 12 },
                color: "#1e293b",
                padding: 16,
            },
        },
        tooltip: { enabled: false },
    },
    devicePixelRatio: 2,
};

function makeCanvas(w, h) {
    return new ChartJSNodeCanvas({
        width: w,
        height: h,
        backgroundColour: "white",
        chartCallback: (ChartJS) => {
            ChartJS.defaults.font.family = FONT;
        },
    });
}

function fmt(n) {
    if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000)     return `₹${(n / 1_000).toFixed(1)}k`;
    return `₹${n.toFixed(0)}`;
}

// ─── 1. Monthly Trend Bar + Line Chart ───────────────────────────────────────
export async function generateMonthlyTrendChart(trend) {
    const canvas = makeCanvas(780, 320);
    const labels = trend.map((t) => t.label);
    const grossData = trend.map((t) => t.gross);
    const netData   = trend.map((t) => t.net);

    return canvas.renderToBuffer({
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    type: "bar",
                    label: "Gross Payroll",
                    data: grossData,
                    backgroundColor: PALETTE.blueLight,
                    borderColor: PALETTE.blue,
                    borderWidth: 1.5,
                    borderRadius: 4,
                    yAxisID: "y",
                },
                {
                    type: "line",
                    label: "Net Payroll",
                    data: netData,
                    borderColor: PALETTE.green,
                    backgroundColor: PALETTE.greenLight,
                    borderWidth: 2.5,
                    pointRadius: 4,
                    pointBackgroundColor: PALETTE.green,
                    fill: true,
                    tension: 0.3,
                    yAxisID: "y",
                },
            ],
        },
        options: {
            ...GLOBAL_DEFAULTS,
            plugins: {
                ...GLOBAL_DEFAULTS.plugins,
                title: {
                    display: true,
                    text: "12-Month Payroll Trend",
                    font: { size: 14, weight: "bold" },
                    color: "#0f172a",
                    padding: { bottom: 12 },
                },
            },
            scales: {
                x: {
                    grid: { color: "#f1f5f9" },
                    ticks: { font: { size: 10 }, maxRotation: 45 },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9" },
                    ticks: {
                        font: { size: 10 },
                        callback: (v) => fmt(v),
                    },
                },
            },
        },
    });
}

// ─── 2. Department Doughnut Chart ─────────────────────────────────────────────
export async function generateDeptDoughnutChart(deptBreakdown) {
    const canvas = makeCanvas(520, 320);
    const labels = deptBreakdown.map((d) => d.name);
    const data   = deptBreakdown.map((d) => d.totalNet);

    return canvas.renderToBuffer({
        type: "doughnut",
        data: {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: PIE_COLORS.slice(0, labels.length),
                    borderColor: "#ffffff",
                    borderWidth: 2,
                    hoverOffset: 6,
                },
            ],
        },
        options: {
            ...GLOBAL_DEFAULTS,
            cutout: "58%",
            plugins: {
                ...GLOBAL_DEFAULTS.plugins,
                title: {
                    display: true,
                    text: "Payroll by Department",
                    font: { size: 14, weight: "bold" },
                    color: "#0f172a",
                    padding: { bottom: 12 },
                },
                legend: {
                    ...GLOBAL_DEFAULTS.plugins.legend,
                    position: "right",
                },
            },
        },
    });
}

// ─── 3. Earnings Structure Stacked Bar (top 15 employees) ────────────────────
export async function generateEarningsStackedBarChart(employees) {
    const top = employees.slice(0, 15);
    const canvas = makeCanvas(780, 340);
    const labels = top.map((e) => e.employeeName.split(" ")[0]);

    return canvas.renderToBuffer({
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Base",
                    data: top.map((e) => e.base),
                    backgroundColor: PALETTE.blue,
                    stack: "earnings",
                    borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 3, bottomRight: 3 },
                },
                {
                    label: "HRA",
                    data: top.map((e) => e.hra),
                    backgroundColor: PALETTE.indigo,
                    stack: "earnings",
                },
                {
                    label: "LTA",
                    data: top.map((e) => e.lta),
                    backgroundColor: PALETTE.purple,
                    stack: "earnings",
                },
                {
                    label: "Bonus",
                    data: top.map((e) => e.totalBonus),
                    backgroundColor: PALETTE.green,
                    stack: "earnings",
                },
                {
                    label: "Deduction",
                    data: top.map((e) => -e.totalDeduction),
                    backgroundColor: PALETTE.red,
                    stack: "deductions",
                    borderRadius: { topLeft: 3, topRight: 3, bottomLeft: 0, bottomRight: 0 },
                },
            ],
        },
        options: {
            ...GLOBAL_DEFAULTS,
            plugins: {
                ...GLOBAL_DEFAULTS.plugins,
                title: {
                    display: true,
                    text: "Earnings Structure (Top 15 Employees)",
                    font: { size: 14, weight: "bold" },
                    color: "#0f172a",
                    padding: { bottom: 10 },
                },
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false },
                    ticks: { font: { size: 9 }, maxRotation: 45 },
                },
                y: {
                    stacked: true,
                    grid: { color: "#f1f5f9" },
                    ticks: {
                        font: { size: 10 },
                        callback: (v) => fmt(v),
                    },
                },
            },
        },
    });
}

// ─── 4. Salary Distribution Histogram ────────────────────────────────────────
export async function generateSalaryDistributionChart(distribution) {
    const canvas = makeCanvas(520, 280);
    return canvas.renderToBuffer({
        type: "bar",
        data: {
            labels: distribution.map((d) => d.range),
            datasets: [
                {
                    label: "Employees",
                    data: distribution.map((d) => d.count),
                    backgroundColor: PALETTE.amber,
                    borderColor: PALETTE.amberLight,
                    borderWidth: 1.5,
                    borderRadius: 4,
                },
            ],
        },
        options: {
            ...GLOBAL_DEFAULTS,
            plugins: {
                ...GLOBAL_DEFAULTS.plugins,
                title: {
                    display: true,
                    text: "Net Pay Distribution",
                    font: { size: 13, weight: "bold" },
                    color: "#0f172a",
                    padding: { bottom: 10 },
                },
                legend: { display: false },
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 9 }, maxRotation: 30 },
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9" },
                    ticks: { stepSize: 1, font: { size: 10 } },
                    title: { display: true, text: "No. of Employees", font: { size: 10 } },
                },
            },
        },
    });
}

// ─── 5. Bonus Category Bar Chart ──────────────────────────────────────────────
export async function generateBonusCategoryChart(topBonusCategories) {
    const canvas = makeCanvas(520, 280);
    return canvas.renderToBuffer({
        type: "bar",
        data: {
            labels: topBonusCategories.map((b) => b.reason),
            datasets: [
                {
                    label: "Total Bonus",
                    data: topBonusCategories.map((b) => b.amount),
                    backgroundColor: PALETTE.green,
                    borderRadius: 4,
                    borderSkipped: false,
                },
            ],
        },
        options: {
            ...GLOBAL_DEFAULTS,
            indexAxis: "y",
            plugins: {
                ...GLOBAL_DEFAULTS.plugins,
                title: {
                    display: true,
                    text: "Bonus by Category",
                    font: { size: 13, weight: "bold" },
                    color: "#0f172a",
                    padding: { bottom: 10 },
                },
                legend: { display: false },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9" },
                    ticks: { font: { size: 10 }, callback: (v) => fmt(v) },
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                },
            },
        },
    });
}

// ─── 6. Deduction Category Bar Chart ─────────────────────────────────────────
export async function generateDeductionCategoryChart(topDeductionCategories) {
    const canvas = makeCanvas(520, 280);
    return canvas.renderToBuffer({
        type: "bar",
        data: {
            labels: topDeductionCategories.map((d) => d.reason),
            datasets: [
                {
                    label: "Total Deduction",
                    data: topDeductionCategories.map((d) => d.amount),
                    backgroundColor: PALETTE.red,
                    borderRadius: 4,
                    borderSkipped: false,
                },
            ],
        },
        options: {
            ...GLOBAL_DEFAULTS,
            indexAxis: "y",
            plugins: {
                ...GLOBAL_DEFAULTS.plugins,
                title: {
                    display: true,
                    text: "Deductions by Category",
                    font: { size: 13, weight: "bold" },
                    color: "#0f172a",
                    padding: { bottom: 10 },
                },
                legend: { display: false },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9" },
                    ticks: { font: { size: 10 }, callback: (v) => fmt(v) },
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                },
            },
        },
    });
}

// ─── 7. Top Earners Horizontal Bar ───────────────────────────────────────────
export async function generateTopEarnersChart(topEarners) {
    const canvas = makeCanvas(780, 300);
    const top = topEarners.slice(0, 10);
    return canvas.renderToBuffer({
        type: "bar",
        data: {
            labels: top.map((e) => e.employeeName),
            datasets: [
                {
                    label: "Net Pay",
                    data: top.map((e) => e.net),
                    backgroundColor: top.map((_, i) => PIE_COLORS[i % PIE_COLORS.length]),
                    borderRadius: 4,
                    borderSkipped: false,
                },
            ],
        },
        options: {
            ...GLOBAL_DEFAULTS,
            indexAxis: "y",
            plugins: {
                ...GLOBAL_DEFAULTS.plugins,
                title: {
                    display: true,
                    text: "Top 10 Earners — Net Pay",
                    font: { size: 13, weight: "bold" },
                    color: "#0f172a",
                    padding: { bottom: 10 },
                },
                legend: { display: false },
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9" },
                    ticks: { font: { size: 10 }, callback: (v) => fmt(v) },
                },
                y: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                },
            },
        },
    });
}
