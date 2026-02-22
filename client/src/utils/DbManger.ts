import { openDB } from "idb";
import type { IDBPDatabase } from "idb";

interface QueueItem<T = any> {
    id: string;
    table: "EMPLOYEE" | "ATTENDANCE" | "LEAVEREQUEST" | "LEAVEBALANCE" | "LEAVETYPE" | "SALARIES" | "PAYROLLS" | "DEPARTMENTS" | "SKILLS";
    type: "CREATE" | "UPDATE" | "DELETE";
    payload: T;
    createdAt: Date;
}

class OfflineQueueDB {
    private dbName: string;
    private storeName: string;
    private version: number;

    private db!: IDBPDatabase;

    constructor() {
        this.dbName = "offline-queue";
        this.storeName = "queue";
        this.version = 1;
    }

    async init() {
        this.db = await openDB(this.dbName, this.version, {
            upgrade: (db, _oldVersion, _newVersion, transaction) => {
                let store;

                if (!db.objectStoreNames.contains(this.storeName)) {
                    store = db.createObjectStore(this.storeName, {
                        keyPath: "id",
                    });
                } else {
                    store = transaction.objectStore(this.storeName);
                }
                if (!store.indexNames.contains("table")) {
                    store.createIndex("table", "table", { unique: false });
                }
            },
        });
    }

    async add<T>(item: QueueItem<T>) {
        await this.db.add(this.storeName, item);
    }

    async getAll(): Promise<QueueItem[]> {
        return this.db.getAll(this.storeName);
    }

    async delete(id: number) {
        await this.db.delete(this.storeName, id);
    }

    async clear() {
        await this.db.clear(this.storeName);
    }

    async getMergedData<T extends { _id?: string; id?: string; syncState?: "unsynced" | "synced" }>(
        tableName: QueueItem["table"],
        apiData: T[]
    ): Promise<{ data: T[]; addedCount: number }> {
        const queueItems = await this.getAll();
        const tableQueue = queueItems.filter((q) => q.table === tableName);

        let mergedData = [...apiData];
        let addedCount = 0;

        tableQueue.forEach((item) => {
            if (item.type === "CREATE") {
                const record = item.payload.body as T;
                mergedData.unshift({
                    ...record,
                    _id: item.id,
                    id: item.id, // temporary ID for UI mapping
                    syncState: "unsynced"
                });
                addedCount++;
            } else if (item.type === "UPDATE") {
                const recordId = item.payload.paths[item.payload.paths.length - 1];
                const index = mergedData.findIndex((e) => e._id === recordId || e.id === recordId);
                if (index !== -1) {
                    mergedData[index] = {
                        ...mergedData[index],
                        ...item.payload.body,
                        syncState: "unsynced"
                    };
                }
            } else if (item.type === "DELETE") {
                const recordId = item.payload.paths[item.payload.paths.length - 1];
                mergedData = mergedData.filter((e) => e._id !== recordId && e.id !== recordId);
            }
        });

        return { data: mergedData, addedCount };
    }
}


const offlineQueue = new OfflineQueueDB();
await offlineQueue.init();
export default offlineQueue;