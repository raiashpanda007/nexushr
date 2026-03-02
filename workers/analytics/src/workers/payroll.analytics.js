import SendPayrollReport from "../utils/SendMail.js";
import GetPayrollAnalyticsData from "../utils/PayrollData.js";
import { generatePayrollPDF } from "../utils/PayrollPDF.js";
import { generatePayrollExcel } from "../utils/PayrollExcel.js";
import {
    generateMonthlyTrendChart,
    generateDeptDoughnutChart,
    generateEarningsStackedBarChart,
    generateSalaryDistributionChart,
    generateBonusCategoryChart,
    generateDeductionCategoryChart,
    generateTopEarnersChart,
} from "../utils/PayrollCharts.js";

/**
 * Handle a GET_PAYROLL_ANALYTICS event.
 *
 * Expected event shape:
 *   { type: "GET_PAYROLL_ANALYTICS", month: number, year: number, email: string }
 */
async function HandlePayrollEvent(event, dbClient) {
    const { month, year, email } = event;

    if (!month || !year || !email) {
        console.error("HandlePayrollEvent: missing month, year or email in event", event);
        return;
    }

    console.log(`[Analytics] Generating payroll report for ${month}/${year} → ${email}`);

    // ── 1. Aggregate all payroll data from MongoDB ────────────────────────
    const data = await GetPayrollAnalyticsData(dbClient, month, year);

    if (!data) {
        console.warn(`[Analytics] No payroll data found for ${month}/${year}. Skipping.`);
        return;
    }

    console.log(`[Analytics] Data aggregated. ${data.summary.employeeCount} employees.`);

    // ── 2. Generate all charts in parallel ───────────────────────────────
    const [
        trendBuf,
        deptBuf,
        earningsStackedBuf,
        distributionBuf,
        topEarnersBuf,
        bonusCategoryBuf,
        deductionCategoryBuf,
    ] = await Promise.all([
        generateMonthlyTrendChart(data.trend),
        generateDeptDoughnutChart(data.deptBreakdown),
        generateEarningsStackedBarChart(data.topEarners),
        generateSalaryDistributionChart(data.distribution),
        generateTopEarnersChart(data.topEarners),
        data.topBonusCategories.length > 0
            ? generateBonusCategoryChart(data.topBonusCategories)
            : Promise.resolve(null),
        data.topDeductionCategories.length > 0
            ? generateDeductionCategoryChart(data.topDeductionCategories)
            : Promise.resolve(null),
    ]);

    console.log("[Analytics] All charts rendered.");

    const charts = {
        trend:            trendBuf,
        dept:             deptBuf,
        earningsStacked:  earningsStackedBuf,
        distribution:     distributionBuf,
        topEarners:       topEarnersBuf,
        bonusCategory:    bonusCategoryBuf,
        deductionCategory: deductionCategoryBuf,
    };

    // ── 3. Build the PDF and Excel in parallel ───────────────────────────
    const [pdfBuffer, excelBuffer] = await Promise.all([
        generatePayrollPDF(data, charts),
        generatePayrollExcel(data),
    ]);
    console.log(`[Analytics] PDF generated. Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`[Analytics] Excel generated. Size: ${(excelBuffer.byteLength / 1024).toFixed(1)} KB`);

    // ── 4. Send email with PDF + Excel attached ───────────────────────────
    const { rupee } = _helpers;
    await SendPayrollReport(email, pdfBuffer, excelBuffer, {
        monthName:     data.meta.monthName,
        year:          data.meta.year,
        employeeCount: data.summary.employeeCount,
        totalPayroll:  rupee(data.summary.totalPayroll),
        momChange:     data.summary.momChange,
    });

    console.log(`[Analytics] Report dispatched to ${email}`);
}

// ── tiny rupee formatter (no Intl needed here) ────────────────────────────────
const _helpers = {
    rupee: (n) => {
        if (!n && n !== 0) return "—";
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(n);
    },
};

export default HandlePayrollEvent;