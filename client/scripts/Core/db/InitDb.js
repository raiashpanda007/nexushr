export class IndexedDBManager {
  constructor(dbName, version, onUpgrade) {
    this.dbName = dbName;
    this.version = version;
    this.onUpgradeCallback = onUpgrade
    this.db = null;
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onupgradeneeded = (event) => {
        this.db = event.target.result;

        this.onUpgradeCallback(this.db, event);
      }


      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      }
      request.onerror = () => {
        reject(request.error);
      }

    })
  }

  tx(store, mode = "readonly") {
    if (!this.db) throw new Error("DB not initialized");
    return this.db.transaction(store, mode).objectStore(store);
  }


}
