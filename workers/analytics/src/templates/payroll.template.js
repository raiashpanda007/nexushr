function buildEmailTemplate({ monthName, year, employeeCount, totalPayroll, momChange }) {
    const momText =
        momChange !== null
            ? `<span style="color:${Number(momChange) >= 0 ? "#10b981" : "#ef4444"};font-weight:600">
                  ${Number(momChange) >= 0 ? "▲" : "▼"} ${Math.abs(Number(momChange))}% vs last month
               </span>`
            : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payroll Analytics Report</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- ── Header ── -->
          <tr>
            <td style="background:#1e3a5f;padding:28px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.5px;">NexusHR</h1>
              <p style="margin:4px 0 0;color:#93c5fd;font-size:13px;">Payroll Analytics Report</p>
            </td>
          </tr>

          <!-- ── Banner ── -->
          <tr>
            <td style="background:#2563eb;padding:12px 32px;">
              <p style="margin:0;color:#ffffff;font-size:15px;font-weight:600;">
                ${monthName} ${year} — Payroll Report Ready
              </p>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding:28px 32px;color:#1e293b;font-size:14px;line-height:1.7;">
              <p style="margin-top:0;">Hello,</p>
              <p>
                Your payroll analytics report for <strong>${monthName} ${year}</strong> has been
                generated and is attached to this email as <strong>two files</strong>:
              </p>
              <ul style="padding-left:20px;color:#334155;margin-bottom:0;">
                <li><strong>PDF</strong> — Visual analytics: charts, KPIs, and key insights</li>
                <li><strong>Excel (.xlsx)</strong> — Full raw data: employee details, department breakdown, trend &amp; category data</li>
              </ul>

              <!-- KPI strip -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:6px;overflow:hidden;border:1px solid #e2e8f0;">
                <tr style="background:#eff6ff;">
                  <td style="padding:14px 18px;border-right:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Employees Paid</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#1e3a5f;">${employeeCount}</p>
                  </td>
                  <td style="padding:14px 18px;border-right:1px solid #e2e8f0;">
                    <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Total Net Payroll</p>
                    <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#10b981;">${totalPayroll}</p>
                  </td>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">MoM Change</p>
                    <p style="margin:4px 0 0;font-size:18px;font-weight:700;">${momText || "—"}</p>
                  </td>
                </tr>
              </table>

              <p style="margin-top:18px;"><strong>📊 PDF includes:</strong></p>
              <ul style="padding-left:20px;color:#334155;">
                <li>Executive summary with key metrics</li>
                <li>12-month payroll trend chart</li>
                <li>Department-wise salary distribution chart</li>
                <li>Earnings structure stacked bar chart (Base, HRA, LTA, Bonus)</li>
                <li>Net pay distribution histogram</li>
                <li>Top 10 earners chart</li>
                <li>Bonus &amp; deduction category charts</li>
              </ul>

              <p><strong>📋 Excel workbook includes:</strong></p>
              <ul style="padding-left:20px;color:#334155;">
                <li>Summary KPIs sheet</li>
                <li>Full employee payroll details (all employees)</li>
                <li>Bonus &amp; deduction line items per employee</li>
                <li>Department breakdown</li>
                <li>12-month trend data</li>
                <li>Bonus &amp; deduction category totals</li>
                <li>Net pay distribution buckets</li>
              </ul>

              <p style="margin-bottom:0;">
                This report is <strong>confidential</strong>. Please handle it in accordance with
                your organisation's data privacy policy.
              </p>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                This is an automated message from NexusHR. Please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default buildEmailTemplate;