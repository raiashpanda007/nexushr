import PDFDocument from "pdfkit";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
    brand: "#1e3a5f",      // deep navy
    brandMid: "#2563eb",      // primary blue
    brandLight: "#eff6ff",      // pale blue bg
    accent: "#0ea5e9",      // sky
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    dark: "#0f172a",
    text: "#1e293b",
    muted: "#64748b",
    border: "#e2e8f0",
    white: "#ffffff",
    rowOdd: "#f8fafc",
    rowEven: "#ffffff",
};

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function dollar(n) {
    if (n === undefined || n === null) return "—";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(n);
}

function pct(n) {
    if (n === null || n === undefined) return "N/A";
    const sign = n >= 0 ? "▲" : "▼";
    return `${sign} ${Math.abs(n)}%`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hline(doc, y = null, color = C.border, lw = 0.5) {
    doc.save()
        .strokeColor(color)
        .lineWidth(lw)
        .moveTo(40, y ?? doc.y)
        .lineTo(555, y ?? doc.y)
        .stroke()
        .restore();
}

function filledRect(doc, x, y, w, h, fill) {
    doc.save().rect(x, y, w, h).fill(fill).restore();
}

function sectionTitle(doc, title) {
    doc.moveDown(0.4);
    filledRect(doc, 40, doc.y, 515, 24, C.brand);
    doc.save()
        .font("Helvetica-Bold").fontSize(11).fillColor(C.white)
        .text(title.toUpperCase(), 48, doc.y + 7, { lineBreak: false })
        .restore();
    doc.moveDown(1.4);
}

function kpiBox(doc, x, y, w, h, label, value, subColor = C.brandMid) {
    // shadow
    filledRect(doc, x + 2, y + 2, w, h, "#d1d5db");
    // main box
    filledRect(doc, x, y, w, h, C.white);
    doc.save().rect(x, y, w, h).stroke(C.border).restore();
    // left accent stripe
    filledRect(doc, x, y, 4, h, subColor);

    doc.save()
        .font("Helvetica").fontSize(8).fillColor(C.muted)
        .text(label, x + 10, y + 8, { width: w - 14, lineBreak: false })
        .restore();
    doc.save()
        .font("Helvetica-Bold").fontSize(11).fillColor(C.dark)
        .text(value, x + 10, y + 22, { width: w - 14, lineBreak: false })
        .restore();
    // always leave doc.y below the box
    doc.y = y + h + 2;
}

function tableHeader(doc, columns, y) {
    filledRect(doc, 40, y, 515, 20, C.brand);
    let x = 40;
    for (const col of columns) {
        doc.save()
            .font("Helvetica-Bold").fontSize(8).fillColor(C.white)
            .text(col.label, x + 4, y + 6, { width: col.width - 8, align: col.align || "left", lineBreak: false })
            .restore();
        x += col.width;
    }
    // explicitly advance past header
    doc.y = y + 20;
}

function tableRow(doc, columns, data, y, rowIdx) {
    const bg = rowIdx % 2 === 0 ? C.rowOdd : C.rowEven;
    filledRect(doc, 40, y, 515, 18, bg);
    let x = 40;
    for (const col of columns) {
        const val = data[col.key] ?? "—";
        doc.save()
            .font("Helvetica").fontSize(8).fillColor(C.text)
            .text(String(val), x + 4, y + 5, { width: col.width - 8, align: col.align || "left", lineBreak: false })
            .restore();
        x += col.width;
    }
    // row bottom border
    doc.save().strokeColor(C.border).lineWidth(0.3)
        .moveTo(40, y + 18).lineTo(555, y + 18).stroke().restore();
    // explicitly advance past row — avoids moveDown drift that causes blank pages
    doc.y = y + 18;
}

/**
 * Place a chart image at the current doc.y and correctly advance doc.y
 * to the bottom of the image. Using moveDown(N) after doc.image is wrong
 * because it compounds on the post-image y, causing page overflows.
 */
function placeChart(doc, buffer, x, width, height, gap = 12) {
    const startY = doc.y;
    doc.image(buffer, x, startY, { width, height });
    doc.y = startY + height + gap;
}

/**
 * If less than `needed` points remain on the page, add a new page and
 * re-draw the header so content never bleeds off the bottom.
 */
function _ensureSpace(doc, meta, needed) {
    const BOTTOM = 800; // safe bottom limit (A4 = 842, footer at 810)
    if (doc.y + needed > BOTTOM) {
        doc.addPage();
        _pageHeader(doc, "(continued)", meta);
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a full payroll analytics PDF.
 * @param {Object} data   result from GetPayrollAnalyticsData
 * @param {Object} charts  buffers from PayrollCharts
 * @returns {Promise<Buffer>}
 */
export async function generatePayrollPDF(data, charts) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            size: "A4",
            margins: { top: 40, bottom: 10, left: 40, right: 40 },
            bufferPages: true,
            info: {
                Title: `Payroll Analytics Report — ${data.meta.monthName} ${data.meta.year}`,
                Author: "NexusHR",
                Subject: "Payroll Analytics",
                Creator: "NexusHR Analytics Engine",
            },
        });

        const chunks = [];
        doc.on("data", (c) => chunks.push(c));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // ══════════ PAGE 1  ─  Cover ══════════════════════════════════════
        // Full page header band
        filledRect(doc, 0, 0, 595, 200, C.brand);
        filledRect(doc, 0, 195, 595, 6, C.brandMid);

        doc.save()
            .font("Helvetica-Bold").fontSize(28).fillColor(C.white)
            .text("PAYROLL ANALYTICS", 40, 55, { align: "center", width: 515 })
            .restore();
        doc.save()
            .font("Helvetica-Bold").fontSize(22).fillColor(C.accent)
            .text("REPORT", 40, 88, { align: "center", width: 515 })
            .restore();

        // period pill
        const periodLabel = `${data.meta.monthName} ${data.meta.year}`;
        doc.save()
            .roundedRect(207, 115, 180, 28, 14).fill(C.accent)
            .font("Helvetica-Bold").fontSize(13).fillColor(C.white)
            .text(periodLabel, 207, 122, { align: "center", width: 180 })
            .restore();

        doc.save()
            .font("Helvetica").fontSize(9).fillColor("#94a3b8")
            .text(`Generated on ${new Date(data.meta.generatedAt).toDateString()}`, 40, 158, { align: "center", width: 515 })
            .restore();

        // KPI row on cover
        const s = data.summary;
        const kpis = [
            { label: "Employees Paid", value: s.employeeCount, color: C.brandMid },
            { label: "Total Net Payroll", value: dollar(s.totalPayroll), color: C.success },
            { label: "Avg. Net Pay", value: dollar(s.avgNet), color: C.warning },
            { label: "MoM Change", value: pct(s.momChange), color: s.momChange >= 0 ? C.success : C.danger },
        ];
        let kx = 40;
        for (const k of kpis) {
            kpiBox(doc, kx, 215, 123, 65, k.label, String(k.value), k.color);
            kx += 129;
        }

        doc.moveDown(7);

        // Summary strip
        filledRect(doc, 40, 295, 515, 50, C.brandLight);
        doc.save()
            .font("Helvetica-Bold").fontSize(9).fillColor(C.brand)
            .text("TOP EARNER", 55, 303)
            .font("Helvetica").fillColor(C.text)
            .text(`${s.topEarner.name}  (${s.topEarner.department})  —  ${dollar(s.topEarner.net)}`, 55, 314)
            .restore();
        doc.save()
            .font("Helvetica-Bold").fontSize(9).fillColor(C.brand)
            .text("LOWEST EARNER", 310, 303)
            .font("Helvetica").fillColor(C.text)
            .text(`${s.bottomEarner.name}  (${s.bottomEarner.department})  —  ${dollar(s.bottomEarner.net)}`, 310, 314)
            .restore();

        // Confidential footer
        filledRect(doc, 0, 810, 595, 30, C.brand);
        doc.save()
            .font("Helvetica").fontSize(8).fillColor("#94a3b8")
            .text("CONFIDENTIAL — NexusHR  |  For internal HR use only", 40, 818, { align: "center", width: 515 })
            .restore();

        // ══════════ PAGE 2  ─  Executive Summary ═════════════════════════
        doc.addPage();
        _pageHeader(doc, "Executive Summary", data.meta);

        sectionTitle(doc, "Payroll Overview");

        const kpiRows = [
            [
                { label: "Total Employees in Payroll", value: String(s.employeeCount), color: C.brandMid },
                { label: "Total Gross Payroll", value: dollar(s.totalGross), color: C.brandMid },
                { label: "Total Net Payroll", value: dollar(s.totalPayroll), color: C.success },
            ],
            [
                { label: "Total Bonuses Paid", value: dollar(s.totalBonuses), color: C.success },
                { label: "Total Deductions", value: dollar(s.totalDeductions), color: C.danger },
                { label: "Average Net Pay", value: dollar(s.avgNet), color: C.warning },
            ],
        ];

        for (const row of kpiRows) {
            const rowY = doc.y;
            let rx = 40;
            for (const k of row) {
                kpiBox(doc, rx, rowY, 163, 58, k.label, k.value, k.color);
                rx += 169;
            }
            // advance past the row height (kpiBox already sets doc.y; pick the bottom)
            doc.y = rowY + 58 + 10;
        }

        doc.moveDown(0.5);
        sectionTitle(doc, "Key Insights");

        const insights = [
            `► Payroll for ${s.employeeCount} employee${s.employeeCount !== 1 ? "s" : ""} processed for ${data.meta.monthName} ${data.meta.year}.`,
            `► Bonus to Gross ratio: ${s.totalGross > 0 ? ((s.totalBonuses / s.totalGross) * 100).toFixed(1) : 0}%.`,
            `► Deduction rate: ${s.totalGross > 0 ? ((s.totalDeductions / s.totalGross) * 100).toFixed(1) : 0}% of gross payroll.`,
            `► Net payroll ${s.momChange !== null ? (s.momChange >= 0 ? `increased by ${s.momChange}%` : `decreased by ${Math.abs(s.momChange)}%`) : "change data unavailable"} versus the previous month.`,
            `► Highest paid: ${s.topEarner.name} (${s.topEarner.department}) at ${dollar(s.topEarner.net)}.`,
            `► Lowest paid: ${s.bottomEarner.name} (${s.bottomEarner.department}) at ${dollar(s.bottomEarner.net)}.`,
        ];

        for (const ins of insights) {
            doc.save()
                .font("Helvetica").fontSize(9.5).fillColor(C.text)
                .text(ins, 48, doc.y, { width: 499 })
                .restore();
            doc.moveDown(0.5);
        }

        _pageFooter(doc, data.meta);

        // ══════════ PAGE 3  ─  Monthly Payroll Trend ═════════════════════
        doc.addPage();
        _pageHeader(doc, "Payroll Trend Analysis", data.meta);
        sectionTitle(doc, "12-Month Payroll Trend");

        if (charts.trend) {
            placeChart(doc, charts.trend, 38, 519, 211);
        }

        doc.moveDown(0.5);
        doc.save()
            .font("Helvetica").fontSize(8.5).fillColor(C.muted)
            .text("Full month-by-month breakdown is available in the attached Excel workbook.", 48, doc.y, { width: 499 })
            .restore();
        doc.moveDown(0.5);

        _pageFooter(doc, data.meta);

        // ══════════ PAGE 4  ─  Department Analysis ═══════════════════════
        doc.addPage();
        _pageHeader(doc, "Department-wise Payroll Analysis", data.meta);
        sectionTitle(doc, "Payroll Distribution by Department");

        if (charts.dept) {
            const deptChartY = doc.y;
            doc.image(charts.dept, 38, deptChartY, { width: 345, height: 212 });

            // Dept legend table alongside chart
            const deptLegendX = 395;
            let dly = deptChartY + 5;
            doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.brand).text("Dept.", deptLegendX, dly).restore();
            doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.brand).text("Net Pay", deptLegendX + 90, dly).restore();
            dly += 14;

            for (const d of data.deptBreakdown.slice(0, 10)) {
                const pctShare = ((d.totalNet / data.summary.totalPayroll) * 100).toFixed(1);
                doc.save().font("Helvetica").fontSize(8).fillColor(C.text)
                    .text(d.name, deptLegendX, dly, { width: 80, lineBreak: false })
                    .restore();
                doc.save().font("Helvetica").fontSize(7.5).fillColor(C.text)
                    .text(`${dollar(d.totalNet)}`, deptLegendX, dly + 9, { width: 80, lineBreak: false })
                    .restore();
                doc.save().font("Helvetica").fontSize(7.5).fillColor(C.muted)
                    .text(`(${pctShare}%)`, deptLegendX + 82, dly + 9, { width: 30, lineBreak: false })
                    .restore();
                dly += 18;
            }
            doc.y = deptChartY + 212 + 12;
        }

        doc.save()
            .font("Helvetica").fontSize(8.5).fillColor(C.muted)
            .text("Full department-wise payroll data is available in the attached Excel workbook.", 48, doc.y, { width: 499 })
            .restore();
        doc.moveDown(0.5);

        _pageFooter(doc, data.meta);

        // ══════════ PAGE 5  ─  Earnings Structure ════════════════════════
        doc.addPage();
        _pageHeader(doc, "Earnings Structure Analysis", data.meta);
        sectionTitle(doc, "Earnings Breakdown — Top 15 Employees");

        if (charts.earningsStacked) {
            placeChart(doc, charts.earningsStacked, 38, 519, 226);
        }

        doc.moveDown(0.3);
        _ensureSpace(doc, data.meta, 220);
        sectionTitle(doc, "Net Pay Distribution");

        if (charts.distribution) {
            const distChartY = doc.y;
            doc.image(charts.distribution, 38, distChartY, { width: 345, height: 185 });

            // Stats column next to histogram
            const sx = 400;
            let sy = distChartY + 5;
            const netArr = data.employees.map((e) => e.net).sort((a, b) => a - b);
            const med = netArr.length % 2 === 0
                ? (netArr[netArr.length / 2 - 1] + netArr[netArr.length / 2]) / 2
                : netArr[Math.floor(netArr.length / 2)];
            const variance = netArr.reduce((s, v) => s + Math.pow(v - data.summary.avgNet, 2), 0) / netArr.length;
            const stddev = Math.sqrt(variance);

            const stats = [
                ["Minimum", dollar(Math.min(...netArr))],
                ["Maximum", dollar(Math.max(...netArr))],
                ["Median", dollar(med)],
                ["Mean", dollar(data.summary.avgNet)],
                ["Std Dev", dollar(stddev)],
            ];
            for (const [lbl, val] of stats) {
                doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.muted).text(lbl, sx, sy).restore();
                doc.save().font("Helvetica").fontSize(8.5).fillColor(C.dark).text(val, sx + 65, sy).restore();
                sy += 18;
            }
            doc.y = distChartY + 185 + 12;
        }

        _pageFooter(doc, data.meta);

        // ══════════ PAGE 6  ─  Top Earners ═══════════════════════════════
        doc.addPage();
        _pageHeader(doc, "Top Earners", data.meta);
        sectionTitle(doc, "Top 10 Employees by Net Pay");

        if (charts.topEarners) {
            placeChart(doc, charts.topEarners, 38, 519, 199);
        }

        doc.moveDown(0.3);
        const topEarnCols = [
            { label: "#", key: "rank", width: 30, align: "center" },
            { label: "Employee", key: "name", width: 160 },
            { label: "Department", key: "dept", width: 110 },
            { label: "Gross", key: "gross", width: 75, align: "right" },
            { label: "Bonus", key: "bonus", width: 65, align: "right" },
            { label: "Deduction", key: "deduct", width: 75, align: "right" },
        ];

        tableHeader(doc, topEarnCols, doc.y);
        // tableHeader now sets doc.y to header bottom; no extra moveDown needed
        for (let i = 0; i < data.topEarners.length; i++) {
            _ensureSpace(doc, data.meta, 20);
            const e = data.topEarners[i];
            tableRow(doc, topEarnCols, {
                rank: i + 1,
                name: e.employeeName,
                dept: e.department,
                gross: dollar(e.gross),
                bonus: dollar(e.totalBonus),
                deduct: dollar(e.totalDeduction),
            }, doc.y, i);
            // tableRow now sets doc.y to row bottom; no extra moveDown needed
        }

        _pageFooter(doc, data.meta);

        // ══════════ PAGE 7  ─  Bonus Analysis ════════════════
        doc.addPage();
        _pageHeader(doc, "Bonus Analysis", data.meta);

        if (data.topBonusCategories.length > 0) {
            sectionTitle(doc, "Bonus Categories");
            if (charts.bonusCategory) {
                const bonusChartY = doc.y;
                doc.image(charts.bonusCategory, 38, bonusChartY, { width: 345, height: 185 });

                // bonus total alongside
                let bx = 397, by = bonusChartY + 5;
                doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.brand).text("Category", bx, by, { lineBreak: false }).restore();
                doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.brand).text("Amount", bx + 95, by, { lineBreak: false }).restore();
                by += 14;
                for (const b of data.topBonusCategories) {
                    doc.save().font("Helvetica").fontSize(8).fillColor(C.text)
                        .text(b.reason, bx, by, { width: 90, lineBreak: false }).restore();
                    doc.save().font("Helvetica").fontSize(8).fillColor(C.success)
                        .text(dollar(b.amount), bx + 95, by, { width: 65, align: "right", lineBreak: false }).restore();
                    by += 14;
                }
                doc.y = bonusChartY + 185 + 12;
            }
        }

        if (data.bonusDistribution && data.bonusDistribution.length > 0) {
            _ensureSpace(doc, data.meta, 220);
            doc.moveDown(0.3);
            sectionTitle(doc, "Bonus Distribution");
            if (charts.bonusDistribution) {
                const bDistChartY = doc.y;
                doc.image(charts.bonusDistribution, 38, bDistChartY, { width: 345, height: 185 });

                const sx = 400;
                let sy = bDistChartY + 5;
                const bonusArr = data.employees.map((e) => e.totalBonus).filter(b => b > 0).sort((a, b) => a - b);
                if (bonusArr.length > 0) {
                    const bMed = bonusArr.length % 2 === 0
                        ? (bonusArr[bonusArr.length / 2 - 1] + bonusArr[bonusArr.length / 2]) / 2
                        : bonusArr[Math.floor(bonusArr.length / 2)];

                    const stats = [
                        ["Minimum", dollar(Math.min(...bonusArr))],
                        ["Maximum", dollar(Math.max(...bonusArr))],
                        ["Median", dollar(bMed)],
                    ];
                    for (const [lbl, val] of stats) {
                        doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.muted).text(lbl, sx, sy).restore();
                        doc.save().font("Helvetica").fontSize(8.5).fillColor(C.dark).text(val, sx + 65, sy).restore();
                        sy += 18;
                    }
                }
                doc.y = bDistChartY + 185 + 12;
            }
        }

        if (data.deptBonusBreakdown && data.deptBonusBreakdown.length > 0) {
            _ensureSpace(doc, data.meta, 240);
            doc.moveDown(0.3);
            sectionTitle(doc, "Bonus by Department");
            if (charts.deptBonus) {
                const dbChartY = doc.y;
                doc.image(charts.deptBonus, 38, dbChartY, { width: 345, height: 212 });

                const deptLegendX = 395;
                let dly = dbChartY + 5;
                doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.brand).text("Dept.", deptLegendX, dly).restore();
                doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.brand).text("Bonus", deptLegendX + 90, dly).restore();
                dly += 14;

                const totalBonuses = data.summary.totalBonuses || 1;
                for (const d of data.deptBonusBreakdown.slice(0, 10)) {
                    const pctShare = ((d.totalBonus / totalBonuses) * 100).toFixed(1);
                    doc.save().font("Helvetica").fontSize(8).fillColor(C.text)
                        .text(d.name, deptLegendX, dly, { width: 80, lineBreak: false })
                        .restore();
                    doc.save().font("Helvetica").fontSize(7.5).fillColor(C.success)
                        .text(`${dollar(d.totalBonus)}`, deptLegendX, dly + 9, { width: 80, lineBreak: false })
                        .restore();
                    doc.save().font("Helvetica").fontSize(7.5).fillColor(C.muted)
                        .text(`(${pctShare}%)`, deptLegendX + 82, dly + 9, { width: 30, lineBreak: false })
                        .restore();
                    dly += 18;
                }
                doc.y = dbChartY + 212 + 12;
            }
        }

        _pageFooter(doc, data.meta);

        // ══════════ PAGE 8  ─  Deduction Analysis ════════════════
        doc.addPage();
        _pageHeader(doc, "Deduction Analysis", data.meta);

        if (data.topDeductionCategories.length > 0) {
            sectionTitle(doc, "Deduction Categories");
            if (charts.deductionCategory) {
                const dedChartY = doc.y;
                doc.image(charts.deductionCategory, 38, dedChartY, { width: 345, height: 185 });

                let dx = 397, dy = dedChartY + 5;
                doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.brand).text("Category", dx, dy, { lineBreak: false }).restore();
                doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.brand).text("Amount", dx + 95, dy, { lineBreak: false }).restore();
                dy += 14;
                for (const d of data.topDeductionCategories) {
                    doc.save().font("Helvetica").fontSize(8).fillColor(C.text)
                        .text(d.reason, dx, dy, { width: 90, lineBreak: false }).restore();
                    doc.save().font("Helvetica").fontSize(8).fillColor(C.danger)
                        .text(dollar(d.amount), dx + 95, dy, { width: 65, align: "right", lineBreak: false }).restore();
                    dy += 14;
                }
                doc.y = dedChartY + 185 + 12;
            }
        }

        if (data.deductionDistribution && data.deductionDistribution.length > 0) {
            _ensureSpace(doc, data.meta, 220);
            doc.moveDown(0.3);
            sectionTitle(doc, "Deduction Distribution");
            if (charts.deductionDistribution) {
                const dDistChartY = doc.y;
                doc.image(charts.deductionDistribution, 38, dDistChartY, { width: 345, height: 185 });

                const sx = 400;
                let sy = dDistChartY + 5;
                const dedArr = data.employees.map((e) => e.totalDeduction).filter(d => d > 0).sort((a, b) => a - b);
                if (dedArr.length > 0) {
                    const dMed = dedArr.length % 2 === 0
                        ? (dedArr[dedArr.length / 2 - 1] + dedArr[dedArr.length / 2]) / 2
                        : dedArr[Math.floor(dedArr.length / 2)];

                    const stats = [
                        ["Minimum", dollar(Math.min(...dedArr))],
                        ["Maximum", dollar(Math.max(...dedArr))],
                        ["Median", dollar(dMed)],
                    ];
                    for (const [lbl, val] of stats) {
                        doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.muted).text(lbl, sx, sy).restore();
                        doc.save().font("Helvetica").fontSize(8.5).fillColor(C.dark).text(val, sx + 65, sy).restore();
                        sy += 18;
                    }
                }
                doc.y = dDistChartY + 185 + 12;
            }
        }

        if (data.deptDeductionBreakdown && data.deptDeductionBreakdown.length > 0) {
            _ensureSpace(doc, data.meta, 240);
            doc.moveDown(0.3);
            sectionTitle(doc, "Deductions by Department");
            if (charts.deptDeduction) {
                const ddChartY = doc.y;
                doc.image(charts.deptDeduction, 38, ddChartY, { width: 345, height: 212 });

                const deptLegendX = 395;
                let dly = ddChartY + 5;
                doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.brand).text("Dept.", deptLegendX, dly).restore();
                doc.save().font("Helvetica-Bold").fontSize(8).fillColor(C.brand).text("Deduction", deptLegendX + 90, dly).restore();
                dly += 14;

                const totalDeductions = data.summary.totalDeductions || 1;
                for (const d of data.deptDeductionBreakdown.slice(0, 10)) {
                    const pctShare = ((d.totalDeduction / totalDeductions) * 100).toFixed(1);
                    doc.save().font("Helvetica").fontSize(8).fillColor(C.text)
                        .text(d.name, deptLegendX, dly, { width: 80, lineBreak: false })
                        .restore();
                    doc.save().font("Helvetica").fontSize(7.5).fillColor(C.danger)
                        .text(`${dollar(d.totalDeduction)}`, deptLegendX, dly + 9, { width: 80, lineBreak: false })
                        .restore();
                    doc.save().font("Helvetica").fontSize(7.5).fillColor(C.muted)
                        .text(`(${pctShare}%)`, deptLegendX + 82, dly + 9, { width: 30, lineBreak: false })
                        .restore();
                    dly += 18;
                }
                doc.y = ddChartY + 212 + 12;
            }
        }

        _pageFooter(doc, data.meta);

        // ══════════ Add page numbers to all pages ════════════════════════
        const totalPages = doc.bufferedPageRange().count;
        for (let i = 0; i < totalPages; i++) {
            doc.switchToPage(i);
            doc.save()
                .font("Helvetica").fontSize(8).fillColor(C.muted)
                .text(`Page ${i + 1} of ${totalPages}`, 40, 816, { align: "right", width: 515 })
                .restore();
        }

        doc.end();
    });
}

// ─── Private helpers ──────────────────────────────────────────────────────────

function _pageHeader(doc, title, meta) {
    filledRect(doc, 40, 35, 515, 30, C.brand);
    doc.save()
        .font("Helvetica-Bold").fontSize(12).fillColor(C.white)
        .text(title, 50, 44, { lineBreak: false })
        .restore();
    doc.save()
        .font("Helvetica").fontSize(8).fillColor("#93c5fd")
        .text(`${meta.monthName} ${meta.year}  |  NexusHR`, 50, 44 + 14, { lineBreak: false })
        .restore();
    hline(doc, 68, C.brandMid, 1);
    doc.y = 78;
}

function _pageFooter(doc, meta) {
    hline(doc, 810, C.border, 0.5);
    doc.save()
        .font("Helvetica").fontSize(7.5).fillColor(C.muted)
        .text(
            `NexusHR  |  Payroll Report  |  ${meta.monthName} ${meta.year}  |  Confidential`,
            40, 816, { align: "center", width: 515 },
        )
        .restore();
}
