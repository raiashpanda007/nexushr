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
