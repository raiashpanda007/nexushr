importScripts("https://unpkg.com/pdf-lib/dist/pdf-lib.min.js");

self.onmessage = async (e) => {
    const {
        payrollID,
        userFirstName,
        userLastName,
        month,
        year,
        salary,
        bonuses,
        deductions,
        total
    } = e.data;

    const { PDFDocument, StandardFonts, rgb } = PDFLib;

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 780;

    // Header
    page.drawText("Payslip", {
        x: 250,
        y,
        size: 22,
        font: boldFont
    });

    y -= 40;

    page.drawText(`Payroll ID: ${payrollID}`, { x: 50, y, size: 12, font });
    y -= 20;

    page.drawText(`Employee: ${userFirstName} ${userLastName}`, {
        x: 50, y, size: 12, font
    });
    y -= 20;

    page.drawText(`Period: ${month} ${year}`, {
        x: 50, y, size: 12, font
    });

    y -= 40;


    const rows = [
        ["Base Salary", salary],
        ["Bonuses", bonuses],
        ["Deductions", -deductions],
        ["Total Pay", total]
    ];

    for (const [label, value] of rows) {
        page.drawText(label, { x: 50, y, size: 12, font });
        page.drawText(`$ ${value.toLocaleString()}`, {
            x: 400, y, size: 12, font
        });
        y -= 20;
    }

    const bytes = await pdfDoc.save();

    self.postMessage(
        {
            buffer: bytes.buffer,
            filename: `${payrollID}-${month}-${year}.pdf`
        },
        [bytes.buffer]
    );
};
