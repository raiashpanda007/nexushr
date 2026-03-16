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
    generateDeptBonusDoughnutChart,
    generateDeptDeductionDoughnutChart,
    generateBonusDistributionChart,
    generateDeductionDistributionChart,
} from "../utils/PayrollCharts.js";


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
        deptBonusBuf,
        deptDeductionBuf,
        bonusDistributionBuf,
        deductionDistributionBuf,
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
        data.deptBonusBreakdown.length > 0
            ? generateDeptBonusDoughnutChart(data.deptBonusBreakdown)
            : Promise.resolve(null),
        data.deptDeductionBreakdown.length > 0
            ? generateDeptDeductionDoughnutChart(data.deptDeductionBreakdown)
            : Promise.resolve(null),
        data.bonusDistribution.length > 0
            ? generateBonusDistributionChart(data.bonusDistribution)
            : Promise.resolve(null),
        data.deductionDistribution.length > 0
            ? generateDeductionDistributionChart(data.deductionDistribution)
            : Promise.resolve(null),
    ]);

    console.log("[Analytics] All charts rendered.");

    const charts = {
        trend: trendBuf,
        dept: deptBuf,
        earningsStacked: earningsStackedBuf,
        distribution: distributionBuf,
        topEarners: topEarnersBuf,
        bonusCategory: bonusCategoryBuf,
        deductionCategory: deductionCategoryBuf,
        deptBonus: deptBonusBuf,
        deptDeduction: deptDeductionBuf,
        bonusDistribution: bonusDistributionBuf,
        deductionDistribution: deductionDistributionBuf,
    };

    // ── 3. Build the PDF and Excel in parallel ───────────────────────────
    const [pdfBuffer, excelBuffer] = await Promise.all([
        generatePayrollPDF(data, charts),
        generatePayrollExcel(data),
    ]);
    console.log(`[Analytics] PDF generated. Size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);
    console.log(`[Analytics] Excel generated. Size: ${(excelBuffer.byteLength / 1024).toFixed(1)} KB`);

    // ── 4. Send email with PDF + Excel attached ───────────────────────────
    const { dollar } = _helpers;
    await SendPayrollReport(email, pdfBuffer, excelBuffer, {
        monthName: data.meta.monthName,
        year: data.meta.year,
        employeeCount: data.summary.employeeCount,
        totalPayroll: dollar(data.summary.totalPayroll),
        momChange: data.summary.momChange,
    });

    console.log(`[Analytics] Report dispatched to ${email}`);
}

// ── tiny dollar formatter ────────────────────────────────
const _helpers = {
    dollar: (n) => {
        if (!n && n !== 0) return "—";
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(n);
    },
};

export default HandlePayrollEvent;