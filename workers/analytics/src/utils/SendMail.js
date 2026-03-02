import nodemailer from "nodemailer";
import { Cfg } from "../config/Config.js";
import buildEmailTemplate from "../templates/payroll.template.js";




async function SendPayrollReport(recipientEmail, pdfBuffer, meta) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: Cfg.USER_EMAIL,
            pass: Cfg.USER_PASSWORD,
        },
    });

    const html = buildEmailTemplate(meta);
    const fileName = `payroll-report-${meta.monthName.toLowerCase()}-${meta.year}.pdf`;

    const mailOptions = {
        from: `"NexusHR Analytics" <${Cfg.USER_EMAIL}>`,
        to: recipientEmail,
        subject: `📊 Payroll Analytics Report — ${meta.monthName} ${meta.year}`,
        html,
        attachments: [
            {
                filename: fileName,
                content: pdfBuffer,
                contentType: "application/pdf",
            },
        ],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Payroll report email sent:", info.messageId, "→", recipientEmail);
    return info;
}

export default SendPayrollReport;