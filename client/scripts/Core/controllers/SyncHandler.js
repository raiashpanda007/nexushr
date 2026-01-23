class SyncQueueHandler {
  constructor(repo, networkState) {
    this.repo = repo;
    this.networkState = networkState;
  }
  async AddItemToQueue(table, operation, data) {
    if (!this.networkState.isOnline) {
      try {
        const response = await this.repo.AddToSyncQueue(table, operation, data);
        return {
          ok: response.ok,
          data: response.data,
        };
      } catch (error) {
        console.error("Error in AddItemToQueue :: ", error);
        return { ok: false, data: error };
      }
    }

    return { ok: true, data: "Online - No need to queue" };
  }
  async FlushQueue() {
    if (this.networkState.isOnline) {
      try {
        const response = await this.repo.GetAllQueueItems();
        const apiRes = await fetch("http://localhost:3000/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: "Sync request from client",
            data: response.data,
          }),
        });

         await this.repo.FlushAsyncQueue();
        
        return {
          ok: apiRes.ok,
          data: await apiRes.text(),
        };
      } catch (error) {
        console.error("Error in FlushQueue :: ", error);
        return { ok: false, data: error };
      }
    }
    return { ok: false, data: "Offline - Cannot flush queue" };
  }
  async GetAllAsyncQueueItemsOfTable(table) {
    try {
      const response = await this.repo.GetAllQueueItemsFromTable(table);
      return {
        ok: response.ok,
        data: response.data,
      };
    } catch (error) {
      console.error("Error in GetAllAsyncQueueItemsOfTable :: ", error);
      return { ok: false, data: error };
    }
  }
}


export default SyncQueueHandler;