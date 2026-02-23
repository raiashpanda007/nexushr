import { openDB } from "idb";
import type { IDBPDatabase } from "idb";

export type PunchType = "IN" | "OUT";

interface AttendanceQueueItem {
    id: string;
    type: PunchType;
    createdAt: number;
}

class OfflineAttendanceQueue {
    private dbName = "attendance-queue";
    private storeName = "punches";
    private version = 1;

    private db!: IDBPDatabase;

    async init() {
        this.db = await openDB(this.dbName, this.version, {
            upgrade: (db) => {
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, {
                        keyPath: "id",
                    });

                    store.createIndex("createdAt", "createdAt");
                }
            },
        });
    }

    async addPunch(type: PunchType) {
        await this.db.add(this.storeName, {
            id: crypto.randomUUID(),
            type,
            createdAt: Date.now(),
        });
    }

    async getAllPunches(): Promise<AttendanceQueueItem[]> {
        return this.db.getAllFromIndex(this.storeName, "createdAt");
    }

    async deletePunch(id: string) {
        await this.db.delete(this.storeName, id);
    }

    async clear() {
        await this.db.clear(this.storeName);
    }

    async flushInBatches(
        sendBatchToServer: (batch: AttendanceQueueItem[]) => Promise<void>,
        batchSize = 10
    ) {
        const punches = await this.getAllPunches();

        for (let i = 0; i < punches.length; i += batchSize) {
            const batch = punches.slice(i, i + batchSize);

            try {
                await sendBatchToServer(batch);

                for (const item of batch) {
                    await this.deletePunch(item.id);
                }
            } catch (err) {
                console.error("Batch failed — stopping sync", err);
                break;
            }
        }
    }
}

const attendanceQueue = new OfflineAttendanceQueue();
await attendanceQueue.init();

export default attendanceQueue;