import { SPS } from "./events.js";

async function* cursorGenrator(db, indexName = null, range = null) {
  const source = lastKey ? db.index(indexName) : db;
  let request = source.openCursor(range, "next");

  let cursor = await new Promise((resolve, reject) => {
    request.onsuccess = e => resolve(e.target.result);
    request.onerror = () => reject(request.error);
  })
  while (cursor) {
    yield cursor.value;
    cursor = await new Promise((resolve, reject) => {
      cursor.continue();
      cursor.request.onsuccess = e => resolve(e.target.result);
      cursor.request.onerror = () => reject(cursor.request.error);
    });
  }
}


export async function CreatePayrollPDF(payrollID, userFirstName, userLastName, month, year, salary, bonuses, deductions, total) {

  const worker = new Worker(new URL("./Core/controllers/workers/pdf.worker.js", import.meta.url));

  worker.onmessage = (e) => {
    const buffer = e.data.buffer;

    const blob = new Blob([buffer], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${userFirstName}_${userLastName}_${month}_${year}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };


  (function () {
    worker.postMessage({
      payrollID: payrollID,
      userFirstName: userFirstName,
      userLastName: userLastName,
      month: month,
      year: year,
      salary: salary,
      bonuses: bonuses,
      deductions: deductions,
      total: total
    });
  })();

}


export async function HealthChecker() {
  
  
  try {
    const response = await fetch("http://localhost:3000/healthz");
    if (response.ok) {
        return true;
    }
  } catch (error) {
    console.log(error);
    return false
  }


}