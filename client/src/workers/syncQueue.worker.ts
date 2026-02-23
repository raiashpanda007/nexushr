

const DB_NAME = "attendance-queue";
const STORE_NAME = "punches";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
                store.createIndex("createdAt", "createdAt");
            }
        };
    });
}

function getAllPunches(db: IDBDatabase): Promise<{ id: string; type: "IN" | "OUT"; createdAt: number }[]> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const index = store.index("createdAt");
        const req = index.getAll();
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => reject(req.error);
    });
}

function deletePunch(db: IDBDatabase, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function flush(baseUrl: string) {
    const db = await openDB();
    const punches = await getAllPunches(db);

    if (punches.length === 0) {
        self.postMessage({ type: "FLUSH_COMPLETE" });
        return;
    }

    const BATCH_SIZE = 10;

    for (let i = 0; i < punches.length; i += BATCH_SIZE) {
        const batch = punches.slice(i, i + BATCH_SIZE);

        try {
            const res = await fetch(`${baseUrl}/api/v1/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(batch),
            });

            if (!res.ok) {
                const text = await res.text();
                self.postMessage({ type: "FLUSH_ERROR", error: `Server responded ${res.status}: ${text}` });
                return;
            }


            for (const punch of batch) {
                await deletePunch(db, punch.id);
            }
        } catch (err) {
            self.postMessage({ type: "FLUSH_ERROR", error: String(err) });
            return;
        }
    }

    self.postMessage({ type: "FLUSH_COMPLETE" });
}

self.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type === "FLUSH") {
        const baseUrl: string = e.data.baseUrl ?? "http://localhost:8000";
        flush(baseUrl).catch((err) => {
            self.postMessage({ type: "FLUSH_ERROR", error: String(err) });
        });
    }
});
