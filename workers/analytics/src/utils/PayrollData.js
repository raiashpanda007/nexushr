import { ObjectId } from "mongodb";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

/**
 * Compute net pay for a single payroll record.
 * gross = base + hra + lta
 * net   = gross + sum(bonus) - |sum(deduction)|
 */
function calcNet(payroll) {
    const salary = payroll.salary || {};
    const base = salary.base || 0;
    const hra = salary.hra || 0;
    const lta = salary.lta || 0;
    const gross = base + hra + lta;

    const totalBonus = (payroll.bonus || []).reduce((s, b) => s + Math.abs(b.amount), 0);
    const totalDeduction = (payroll.deduction || []).reduce((s, d) => s + Math.abs(d.amount), 0);

    return {
        base,
        hra,
        lta,
        gross,
        totalBonus,
        totalDeduction,
        net: gross + totalBonus - totalDeduction,
    };
}

/**
 * Fetch and aggregate all payroll data needed for the analytics PDF.
 * @param {import("../utils/Db.js").default} db
 * @param {number} month  1-12
 * @param {number} year
 */
async function GetPayrollAnalyticsData(db, month, year) {
    const payrolls = db.getCollection("payrolls");
    const users = db.getCollection("users");
    const salaries = db.getCollection("salaries");
    const departments = db.getCollection("departments");

    // ─── 1. Current month payroll records ────────────────────────────────
    const rawPayrolls = await payrolls
        .find({ month, year })
        .toArray();

    if (rawPayrolls.length === 0) {
        return null;
    }

    // ─── 2. Resolve salary and user IDs ──────────────────────────────────
    const salaryIds = [...new Set(rawPayrolls.map((p) => p.salary?.toString()).filter(Boolean))];
    const userIds = [...new Set(rawPayrolls.map((p) => p.user?.toString()).filter(Boolean))];

    const [salaryDocs, userDocs, deptDocs] = await Promise.all([
        salaries.find({ _id: { $in: salaryIds.map((id) => new ObjectId(id)) } }).toArray(),
        users
            .find(
                { _id: { $in: userIds.map((id) => new ObjectId(id)) } },
                { projection: { firstName: 1, lastName: 1, email: 1, deptId: 1, profilePhoto: 1 } },
            )
            .toArray(),
        departments.find({}).toArray(),
    ]);

    const salaryMap = Object.fromEntries(salaryDocs.map((s) => [s._id.toString(), s]));
    const userMap = Object.fromEntries(userDocs.map((u) => [u._id.toString(), u]));
    const deptMap = Object.fromEntries(deptDocs.map((d) => [d._id.toString(), d]));

    // ─── 3. Enrich payroll records ────────────────────────────────────────
    const enriched = rawPayrolls.map((p) => {
        const salary = salaryMap[p.salary?.toString()] || {};
        const user = userMap[p.user?.toString()] || {};
        const dept = deptMap[user.deptId?.toString()] || {};

        const calcs = calcNet({ ...p, salary });

        return {
            _id: p._id.toString(),
            month: p.month,
            year: p.year,
            employeeName: `${user.firstName || "Unknown"} ${user.lastName || ""}`.trim(),
            email: user.email || "",
            department: dept.name || "Unknown",
            deptId: user.deptId?.toString() || "unknown",
            profilePhoto: user.profilePhoto || null,
            bonus: p.bonus || [],
            deduction: p.deduction || [],
            salary,
            ...calcs,
        };
    });

    // ─── 4. Executive summary ─────────────────────────────────────────────
    const totalPayroll = enriched.reduce((s, e) => s + e.net, 0);
    const totalGross = enriched.reduce((s, e) => s + e.gross, 0);
    const totalBonuses = enriched.reduce((s, e) => s + e.totalBonus, 0);
    const totalDeductions = enriched.reduce((s, e) => s + e.totalDeduction, 0);
    const avgNet = totalPayroll / enriched.length;

    const sorted = [...enriched].sort((a, b) => b.net - a.net);
    const topEarner = sorted[0];
    const bottomEarner = sorted[sorted.length - 1];

    // ─── 5. Department breakdown ──────────────────────────────────────────
    const deptBreakdown = {};
    for (const e of enriched) {
        if (!deptBreakdown[e.department]) {
            deptBreakdown[e.department] = { name: e.department, count: 0, totalNet: 0, totalGross: 0 };
        }
        deptBreakdown[e.department].count++;
        deptBreakdown[e.department].totalNet += e.net;
        deptBreakdown[e.department].totalGross += e.gross;
    }
    const deptArray = Object.values(deptBreakdown).sort((a, b) => b.totalNet - a.totalNet);

    // ─── 6. Monthly trend (last 12 months incl. current) ─────────────────
    const trendMonths = [];
    for (let i = 11; i >= 0; i--) {
        let m = month - i;
        let y = year;
        while (m <= 0) {
            m += 12;
            y -= 1;
        }
        trendMonths.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1].slice(0, 3)} ${y}` });
    }

    const trendPayrolls = await payrolls
        .aggregate([
            {
                $match: {
                    $or: trendMonths.map(({ month: m, year: y }) => ({ month: m, year: y })),
                },
            },
            {
                $lookup: {
                    from: "salaries",
                    localField: "salary",
                    foreignField: "_id",
                    as: "salaryDoc",
                },
            },
            {
                $unwind: { path: "$salaryDoc", preserveNullAndEmptyArrays: true },
            },
            {
                $group: {
                    _id: { month: "$month", year: "$year" },
                    totalBase: { $sum: "$salaryDoc.base" },
                    totalHra: { $sum: "$salaryDoc.hra" },
                    totalLta: { $sum: "$salaryDoc.lta" },
                    totalBonus: {
                        $sum: {
                            $reduce: {
                                input: "$bonus",
                                initialValue: 0,
                                in: { $add: ["$$value", { $abs: "$$this.amount" }] },
                            },
                        },
                    },
                    totalDeduction: {
                        $sum: {
                            $reduce: {
                                input: "$deduction",
                                initialValue: 0,
                                in: { $add: ["$$value", { $abs: "$$this.amount" }] },
                            },
                        },
                    },
                    count: { $sum: 1 },
                },
            },
        ])
        .toArray();

    const trendMap = {};
    for (const t of trendPayrolls) {
        const key = `${t._id.month}-${t._id.year}`;
        const gross = t.totalBase + t.totalHra + t.totalLta;
        trendMap[key] = {
            gross,
            net: gross + t.totalBonus - t.totalDeduction,
            count: t.count,
        };
    }

    const trend = trendMonths.map((tm) => {
        const key = `${tm.month}-${tm.year}`;
        return {
            label: tm.label,
            month: tm.month,
            year: tm.year,
            gross: trendMap[key]?.gross || 0,
            net: trendMap[key]?.net || 0,
            count: trendMap[key]?.count || 0,
        };
    });

    // Month-over-month change
    const prevMonthNet = trend[trend.length - 2]?.net || 0;
    const momChange = prevMonthNet > 0 ? (((totalPayroll - prevMonthNet) / prevMonthNet) * 100).toFixed(1) : null;

    // ─── 7. Bonus & deduction category aggregation ────────────────────────
    const bonusCategoryMap = {};
    const deductionCategoryMap = {};

    for (const e of enriched) {
        for (const b of e.bonus) {
            bonusCategoryMap[b.reason] = (bonusCategoryMap[b.reason] || 0) + Math.abs(b.amount);
        }
        for (const d of e.deduction) {
            deductionCategoryMap[d.reason] = (deductionCategoryMap[d.reason] || 0) + Math.abs(d.amount);
        }
    }

    const topBonusCategories = Object.entries(bonusCategoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([reason, amount]) => ({ reason, amount }));

    const topDeductionCategories = Object.entries(deductionCategoryMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([reason, amount]) => ({ reason, amount }));

    // ─── 8. Salary distribution buckets ──────────────────────────────────
    const nets = enriched.map((e) => e.net);
    const minNet = Math.min(...nets);
    const maxNet = Math.max(...nets);
    const bucketSize = Math.max(Math.ceil((maxNet - minNet) / 6), 1);
    const buckets = {};
    for (const net of nets) {
        const bucketStart = Math.floor((net - minNet) / bucketSize) * bucketSize + minNet;
        const label = `₹${(bucketStart / 1000).toFixed(0)}k–₹${((bucketStart + bucketSize) / 1000).toFixed(0)}k`;
        buckets[label] = (buckets[label] || 0) + 1;
    }
    const distribution = Object.entries(buckets).map(([range, count]) => ({ range, count }));

    return {
        meta: {
            month,
            year,
            monthName: MONTH_NAMES[month - 1],
            generatedAt: new Date().toISOString(),
        },
        summary: {
            employeeCount: enriched.length,
            totalGross,
            totalBonuses,
            totalDeductions,
            totalPayroll,
            avgNet,
            topEarner: { name: topEarner.employeeName, net: topEarner.net, department: topEarner.department },
            bottomEarner: { name: bottomEarner.employeeName, net: bottomEarner.net, department: bottomEarner.department },
            momChange,
        },
        employees: enriched,           // sorted by name for table
        topEarners: sorted.slice(0, 10),
        deptBreakdown: deptArray,
        trend,
        topBonusCategories,
        topDeductionCategories,
        distribution,
    };
}

export default GetPayrollAnalyticsData;
