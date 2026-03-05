import ExcelJS from "exceljs";

// ─── Brand colours (ARGB hex, no #) ──────────────────────────────────────────
const CLR = {
    navyFill:   "FF1e3a5f",
    blueFill:   "FF2563eb",
    lightBlue:  "FFeff6ff",
    success:    "FF10b981",
    danger:     "FFef4444",
    warning:    "FFf59e0b",
    muted:      "FF64748b",
    border:     "FFe2e8f0",
    white:      "FFFFFFFF",
    rowOdd:     "FFf8fafc",
    rowEven:    "FFFFFFFF",
};

const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dollarNum(n) {
    return typeof n === "number" ? Math.round(n) : 0;
}

function applyHeaderStyle(cell, bgArgb = CLR.navyFill) {
    cell.font  = { bold: true, color: { argb: CLR.white }, size: 10 };
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: bgArgb } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
        top:    { style: "thin", color: { argb: CLR.border } },
        bottom: { style: "thin", color: { argb: CLR.border } },
        left:   { style: "thin", color: { argb: CLR.border } },
        right:  { style: "thin", color: { argb: CLR.border } },
    };
}

function applyDataStyle(cell, rowIdx, numFmt = null) {
    const isOdd = rowIdx % 2 === 0;
    cell.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: isOdd ? CLR.rowOdd : CLR.rowEven } };
    cell.font  = { size: 9 };
    cell.alignment = { vertical: "middle", wrapText: false };
    if (numFmt) cell.numFmt = numFmt;
    cell.border = {
        bottom: { style: "hair", color: { argb: CLR.border } },
        right:  { style: "hair", color: { argb: CLR.border } },
    };
}

function setColWidths(sheet, widths) {
    widths.forEach((w, i) => {
        sheet.getColumn(i + 1).width = w;
    });
}

function addSheetTitle(sheet, title, colCount) {
    const row = sheet.addRow([title]);
    sheet.mergeCells(row.number, 1, row.number, colCount);
    const c = row.getCell(1);
    c.font  = { bold: true, size: 13, color: { argb: CLR.white } };
    c.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.navyFill } };
    c.alignment = { vertical: "middle", horizontal: "left" };
    row.height = 28;
    sheet.addRow([]); // blank spacer
}

// ─── Sheet builders ──────────────────────────────────────────────────────────

/** Sheet 1: Summary KPIs */
function buildSummarySheet(wb, data) {
    const sheet = wb.addWorksheet("Summary");
    setColWidths(sheet, [36, 22]);

    addSheetTitle(sheet, `Payroll Summary — ${data.meta.monthName} ${data.meta.year}`, 2);

    // sub-header
    const subRow = sheet.addRow(["Metric", "Value"]);
    subRow.eachCell((c) => applyHeaderStyle(c, CLR.blueFill));
    subRow.height = 20;

    const s = data.summary;
    const rows = [
        ["Report Period",              `${data.meta.monthName} ${data.meta.year}`],
        ["Generated At",              new Date(data.meta.generatedAt).toLocaleString("en-US")],
        ["Employees in Payroll",      s.employeeCount],
        ["Total Gross Payroll ($)",   dollarNum(s.totalGross)],
        ["Total Net Payroll ($)",     dollarNum(s.totalPayroll)],
        ["Total Bonuses Paid ($)",    dollarNum(s.totalBonuses)],
        ["Total Deductions ($)",      dollarNum(s.totalDeductions)],
        ["Average Net Pay ($)",       dollarNum(s.avgNet)],
        ["MoM Change (%)",            s.momChange !== null ? Number(s.momChange) : "N/A"],
        ["Top Earner",                `${s.topEarner.name} (${s.topEarner.department}) — $${dollarNum(s.topEarner.net).toLocaleString("en-US")}`],
        ["Lowest Earner",             `${s.bottomEarner.name} (${s.bottomEarner.department}) — $${dollarNum(s.bottomEarner.net).toLocaleString("en-US")}`],
        ["Bonus-to-Gross Ratio (%)",  s.totalGross > 0 ? +((s.totalBonuses / s.totalGross) * 100).toFixed(2) : 0],
        ["Deduction Rate (%)",        s.totalGross > 0 ? +((s.totalDeductions / s.totalGross) * 100).toFixed(2) : 0],
    ];

    rows.forEach((r, i) => {
        const row = sheet.addRow(r);
        applyDataStyle(row.getCell(1), i);
        applyDataStyle(row.getCell(2), i, typeof r[1] === "number" ? "#,##0" : null);
        row.getCell(1).font = { bold: true, size: 9 };
        row.height = 18;
    });
}

/** Sheet 2: Employee Payroll Details — all 12 months */
function buildEmployeeSheet(wb, data) {
    const sheet = wb.addWorksheet("Employee Details");
    setColWidths(sheet, [8, 14, 28, 22, 14, 14, 14, 14, 14, 14, 14, 26]);

    const colCount = 12;
    const startMonth = data.trend[0]?.label || `${data.meta.monthName} ${data.meta.year}`;
    const endMonth   = data.trend[data.trend.length - 1]?.label || `${data.meta.monthName} ${data.meta.year}`;
    addSheetTitle(sheet, `Employee Payroll Details — ${startMonth} to ${endMonth}`, colCount);

    const headers = ["Year", "Month", "Employee Name", "Department", "Base ($)", "HRA ($)", "LTA ($)", "Gross ($)", "Total Bonus ($)", "Total Deduction ($)", "Net Pay ($)", "Email"];
    const hRow = sheet.addRow(headers);
    hRow.height = 22;
    hRow.eachCell((c) => applyHeaderStyle(c));

    // Sort chronologically, then alpha by name
    const sorted = [...(data.allPayrolls || data.employees)]
        .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month !== b.month ? a.month - b.month : a.employeeName.localeCompare(b.employeeName));

    sorted.forEach((e, i) => {
        const row = sheet.addRow([
            e.year,
            e.monthLabel || e.month,
            e.employeeName,
            e.department,
            dollarNum(e.base),
            dollarNum(e.hra),
            dollarNum(e.lta),
            dollarNum(e.gross),
            dollarNum(e.totalBonus),
            dollarNum(e.totalDeduction),
            dollarNum(e.net),
            e.email,
        ]);
        row.height = 17;
        row.eachCell((c, col) => {
            const isCurrency = col >= 5 && col <= 11;
            applyDataStyle(c, i, isCurrency ? "#,##0" : null);
        });
    });

    sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: colCount } };
}

/** Sheet 3: Bonus & Deduction line items — all 12 months */
function buildBonusDeductionSheet(wb, data) {
    const sheet = wb.addWorksheet("Bonus & Deduction Lines");
    setColWidths(sheet, [8, 14, 28, 22, 28, 16, 14]);

    const colCount = 7;
    addSheetTitle(sheet, `Bonus & Deduction Line Items — 12 Months`, colCount);

    const headers = ["Year", "Month", "Employee Name", "Department", "Reason", "Amount ($)", "Type"];
    const hRow = sheet.addRow(headers);
    hRow.height = 22;
    hRow.eachCell((c) => applyHeaderStyle(c));

    let rowIdx = 0;
    const allRecords = [...(data.allPayrolls || data.employees)]
        .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month !== b.month ? a.month - b.month : a.employeeName.localeCompare(b.employeeName));

    for (const e of allRecords) {
        for (const b of e.bonus) {
            const r = sheet.addRow([e.year, e.monthLabel || e.month, e.employeeName, e.department, b.reason, dollarNum(Math.abs(b.amount)), "Bonus"]);
            r.height = 17;
            r.eachCell((c, col) => applyDataStyle(c, rowIdx, col === 6 ? "#,##0" : null));
            r.getCell(7).font = { size: 9, color: { argb: CLR.success } };
            rowIdx++;
        }
        for (const d of e.deduction) {
            const r = sheet.addRow([e.year, e.monthLabel || e.month, e.employeeName, e.department, d.reason, dollarNum(Math.abs(d.amount)), "Deduction"]);
            r.height = 17;
            r.eachCell((c, col) => applyDataStyle(c, rowIdx, col === 6 ? "#,##0" : null));
            r.getCell(7).font = { size: 9, color: { argb: CLR.danger } };
            rowIdx++;
        }
    }

    sheet.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: colCount } };
}

/** Sheet 4: Department Summary */
function buildDeptSheet(wb, data) {
    const sheet = wb.addWorksheet("Department Summary");
    setColWidths(sheet, [26, 14, 18, 18, 18, 14]);

    const colCount = 6;
    addSheetTitle(sheet, `Department Summary — ${data.meta.monthName} ${data.meta.year}`, colCount);

    const headers = ["Department", "Employees", "Total Gross ($)", "Total Net ($)", "Avg Net Pay ($)", "% of Payroll"];
    const hRow = sheet.addRow(headers);
    hRow.height = 22;
    hRow.eachCell((c) => applyHeaderStyle(c));

    data.deptBreakdown.forEach((d, i) => {
        const pctShare = data.summary.totalPayroll > 0
            ? +((d.totalNet / data.summary.totalPayroll) * 100).toFixed(2)
            : 0;
        const row = sheet.addRow([
            d.name,
            d.count,
            dollarNum(d.totalGross),
            dollarNum(d.totalNet),
            dollarNum(d.totalNet / d.count),
            pctShare,
        ]);
        row.height = 17;
        row.eachCell((c, col) => {
            const isCurrency = col >= 3 && col <= 5;
            const isPct = col === 6;
            applyDataStyle(c, i, isCurrency ? "#,##0" : isPct ? "0.00%" : null);
            if (isPct) c.value = pctShare / 100; // Excel wants fraction for % format
        });
    });
}

/** Sheet 5: Monthly Trend */
function buildTrendSheet(wb, data) {
    const sheet = wb.addWorksheet("Monthly Trend");
    setColWidths(sheet, [20, 14, 18, 18, 14]);

    const colCount = 5;
    addSheetTitle(sheet, "12-Month Payroll Trend", colCount);

    const headers = ["Month", "Employees", "Gross Payroll ($)", "Net Payroll ($)", "MoM Change (%)"];
    const hRow = sheet.addRow(headers);
    hRow.height = 22;
    hRow.eachCell((c) => applyHeaderStyle(c));

    data.trend.forEach((t, i, arr) => {
        const prev = arr[i - 1];
        const momChange = prev && prev.net > 0
            ? +((((t.net - prev.net) / prev.net) * 100).toFixed(2))
            : null;

        const row = sheet.addRow([
            t.label,
            t.count,
            dollarNum(t.gross),
            dollarNum(t.net),
            momChange !== null ? momChange / 100 : "N/A",
        ]);
        row.height = 17;
        row.eachCell((c, col) => {
            const isCurrency = col === 3 || col === 4;
            const isPct = col === 5;
            applyDataStyle(c, i, isCurrency ? "#,##0" : isPct && momChange !== null ? "+0.00%;-0.00%;0.00%" : null);
        });

        // colour MoM cell
        if (momChange !== null) {
            row.getCell(5).font = {
                size: 9,
                color: { argb: momChange >= 0 ? CLR.success : CLR.danger },
            };
        }
    });
}

/** Sheet 6: Bonus Categories */
function buildBonusCatSheet(wb, data) {
    if (data.topBonusCategories.length === 0) return;

    const sheet = wb.addWorksheet("Bonus Categories");
    setColWidths(sheet, [34, 18]);

    const colCount = 2;
    addSheetTitle(sheet, `Top Bonus Categories — ${data.meta.monthName} ${data.meta.year}`, colCount);

    const hRow = sheet.addRow(["Bonus Reason", "Total Amount ($)"]);
    hRow.height = 22;
    hRow.eachCell((c) => applyHeaderStyle(c, CLR.success));

    data.topBonusCategories.forEach((b, i) => {
        const row = sheet.addRow([b.reason, dollarNum(b.amount)]);
        row.height = 17;
        applyDataStyle(row.getCell(1), i);
        applyDataStyle(row.getCell(2), i, "#,##0");
        row.getCell(2).font = { size: 9, color: { argb: CLR.success } };
    });
}

/** Sheet 7: Deduction Categories */
function buildDeductionCatSheet(wb, data) {
    if (data.topDeductionCategories.length === 0) return;

    const sheet = wb.addWorksheet("Deduction Categories");
    setColWidths(sheet, [34, 18]);

    const colCount = 2;
    addSheetTitle(sheet, `Top Deduction Categories — ${data.meta.monthName} ${data.meta.year}`, colCount);

    const hRow = sheet.addRow(["Deduction Reason", "Total Amount ($)"]);
    hRow.height = 22;
    hRow.eachCell((c) => applyHeaderStyle(c, CLR.danger));

    data.topDeductionCategories.forEach((d, i) => {
        const row = sheet.addRow([d.reason, dollarNum(d.amount)]);
        row.height = 17;
        applyDataStyle(row.getCell(1), i);
        applyDataStyle(row.getCell(2), i, "#,##0");
        row.getCell(2).font = { size: 9, color: { argb: CLR.danger } };
    });
}

/** Sheet 8: Net Pay Distribution */
function buildDistributionSheet(wb, data) {
    const sheet = wb.addWorksheet("Pay Distribution");
    setColWidths(sheet, [24, 14]);

    const colCount = 2;
    addSheetTitle(sheet, `Net Pay Distribution — ${data.meta.monthName} ${data.meta.year}`, colCount);

    const hRow = sheet.addRow(["Salary Range", "Employee Count"]);
    hRow.height = 22;
    hRow.eachCell((c) => applyHeaderStyle(c, CLR.blueFill));

    data.distribution.forEach((d, i) => {
        const row = sheet.addRow([d.range, d.count]);
        row.height = 17;
        row.eachCell((c) => applyDataStyle(c, i));
    });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a full payroll analytics Excel workbook.
 * @param {Object} data  result from GetPayrollAnalyticsData
 * @returns {Promise<Buffer>}
 */
export async function generatePayrollExcel(data) {
    const wb = new ExcelJS.Workbook();
    wb.creator  = "NexusHR Analytics";
    wb.created  = new Date();
    wb.modified = new Date();
    wb.properties.date1904 = false;

    buildSummarySheet(wb, data);
    buildEmployeeSheet(wb, data);
    buildBonusDeductionSheet(wb, data);
    buildDeptSheet(wb, data);
    buildTrendSheet(wb, data);
    buildBonusCatSheet(wb, data);
    buildDeductionCatSheet(wb, data);
    buildDistributionSheet(wb, data);

    return wb.xlsx.writeBuffer();
}
