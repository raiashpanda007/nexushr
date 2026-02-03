// import { SPS } from "./events.js";

// async function* cursorGenrator(db, indexName = null, range = null) {
//   const source = lastKey ? db.index(indexName) : db;
//   let request = source.openCursor(range, "next");

//   let cursor = await new Promise((resolve, reject) => {
//     request.onsuccess = e => resolve(e.target.result);
//     request.onerror = () => reject(request.error);
//   })
//   while (cursor) {
//     yield cursor.value;
//     cursor = await new Promise((resolve, reject) => {
//       cursor.continue();
//       cursor.request.onsuccess = e => resolve(e.target.result);
//       cursor.request.onerror = () => reject(cursor.request.error);
//     });
//   }
// }
import { syncQueueHandler } from "./Core/startup.js";
import { QueueFlushedEvent, LongPollingEvent } from "./events.js";

export async function CreatePayrollPDF(
  payrollID,
  userFirstName,
  userLastName,
  month,
  year,
  salary,
  bonuses,
  deductions,
  total,
) {
  const worker = new Worker(
    new URL("./Core/controllers/workers/pdf.worker.js", import.meta.url),
  );

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
    worker.terminate();
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
      total: total,
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
    return false;
  }
}

export async function Syncdata() {
  console.log("Syncdata called");
  const flushQueue = await syncQueueHandler.FlushQueue();
  const header = document.querySelector("app-header");
  header.dispatchEvent(QueueFlushedEvent());
  console.log("Flush Queue Response: ", flushQueue);
}

const HEALTH_CHECK_INTERVAL = 30000;
let isPollingUp = false;
let lastResponseAt = Date.now();

export async function LongPolling() {
  const header = document.querySelector("app-header");
  try {
    const res = await fetch("http://localhost:3000/poll");

    const data = await res.json();
    lastResponseAt = Date.now();

    if (!isPollingUp) {
      isPollingUp = true;
      header.dispatchEvent(LongPollingEvent(true));
    }

    if (data.data) {
      window.dispatchEvent(
        new CustomEvent("poll:message", { detail: data.data }),
      );
    }
  } catch (err) {
    console.warn("poll error:", err);
    await new Promise((r) => setTimeout(r, 2000));
  } finally {
    LongPolling();
  }
}

const intervalId = setInterval(() => {
  if (Date.now() - lastResponseAt > HEALTH_CHECK_INTERVAL) {
    if (isPollingUp) {
      isPollingUp = false;
      const header = document.querySelector("app-header");
      header.dispatchEvent(LongPollingEvent(false));
    } else {
      clearInterval(intervalId);
    }
  }
}, 25000);
