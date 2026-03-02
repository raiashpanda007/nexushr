import nodemailer from "nodemailer";
import { Cfg } from "../config/Config.js";
import buildEmailTemplate from "../templates/payroll.template.js";




async function SendPayrollReport(recipientEmail, pdfBuffer, excelBuffer, meta) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: Cfg.USER_EMAIL,
            pass: Cfg.USER_PASSWORD,
        },
    });

    const html = buildEmailTemplate(meta);
    const baseName = `payroll-report-${meta.monthName.toLowerCase()}-${meta.year}`;

    const mailOptions = {
        from: `"NexusHR Analytics" <${Cfg.USER_EMAIL}>`,
        to: recipientEmail,
        subject: `📊 Payroll Analytics Report — ${meta.monthName} ${meta.year}`,
        html,
        attachments: [
            {
                filename: `${baseName}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
            },
            {
                filename: `${baseName}.xlsx`,
                content: Buffer.from(excelBuffer),
                contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
        ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Payroll report email sent:", info.messageId, "→", recipientEmail);
    return info;
}

export default SendPayrollReport;