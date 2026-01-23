class SyncQueueRepo {
  constructor(db) {
    this.db = db;
  }

  async AddToSyncQueue(table, operation, data) {
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const request = this.db.tx("sync_queue", "readwrite").add({
        id,
        table,
        operation,
        data,
        createdAt: new Date().toISOString(),
      });
      request.onsuccess = () =>
        resolve({
          ok: true,
          data: id,
        });
      request.onerror = () =>
        reject({
          ok: false,
          data: request.error,
        });
    });
  }
  async FlushAsyncQueue() {
    return new Promise((resolve, reject) => {
      const store = this.db.tx("sync_queue", "readwrite");
      const request = store.clear();
      request.onsuccess = () =>
        resolve({
          ok: true,
          data: "Sync queue flushed successfully",
        });
      request.onerror = () =>
        reject({
          ok: false,
          data: request.error,
        });
    });
  }

  async GetAllQueueItemsFromTable(table) {
    return new Promise((resolve, reject) => {
      const store = this.db.tx("sync_queue");
      const index = store.index("table_indx");
      const request = index.getAll();
      request.onsuccess = () => {
        const allItems = request.result;
        const filteredItems = allItems.filter((item) => item.table === table);
        resolve({
          ok: true,
          data: filteredItems,
        });
      };
      request.onerror = () =>
        reject({
          ok: false,
          data: request.error,
        });
    });
  }

  async GetAllQueueItems() {
    return new Promise((resolve, reject) => {
      const store = this.db.tx("sync_queue");
      const request = store.getAll();
      request.onsuccess = () =>
        resolve({
          ok: true,
          data: request.result,
        });
      request.onerror = () =>
        reject({
          ok: false,
          data: request.error,
        });
    });
  }
  
}

export default SyncQueueRepo;
