class IndexedDbService {
  getIndexedDbConnection() {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return;
    }
    const CURRENT_VERSION = 8;
    let connection = indexedDB.open('hltv-monkey', CURRENT_VERSION);

    connection.onerror = function() {
      console.log(this);
    }

    connection.onupgradeneeded = function (e) {
      let db = this.result;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('stats')) {
        db.createObjectStore('stats', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('teamstats')) {
        db.createObjectStore('teamstats', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('matchstats')) {
        db.createObjectStore('matchstats', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('tournament')) {
        db.createObjectStore('tournament', { keyPath: 'id' });
      }

      if (e.oldVersion === 8 && CURRENT_VERSION === 9) {
        let tx = db.transaction('teamstats', 'readwrite');
        let store = tx.objectStore('teamstats');
        store.clear()
        tx = db.transaction('matchstats', 'readwrite');
        store = tx.objectStore('matchstats');
        store.clear()
      }
    }

    return connection;
  }

  getReadWriteStore(storeName) {
    let connection = this.getIndexedDbConnection();
    return new Promise((resolve, reject) => {
      connection.onsuccess = function() {
        let db = this.result;
        let tx = db.transaction(storeName, 'readonly');
        let store = tx.objectStore(storeName);
        let readTx = store.get(id);
        readTx.onsuccess = function() {
          if (!this.result) {
            reject()
            return;
          }

          resolve(this.result)
        }
  
        readTx.onerror = function() {
          reject()
        }
      }
    });
  }

  getFromStoreById(storeName, id) {
    let connection = this.getIndexedDbConnection();
    return new Promise((resolve, reject) => {
      connection.onsuccess = function() {
        let db = this.result;
        let tx = db.transaction(storeName, 'readonly');
        let store = tx.objectStore(storeName);
        let readTx = store.get(id);
        readTx.onsuccess = function() {
          if (!this.result) {
            reject()
            return;
          }

          resolve(this.result)
        }
  
        readTx.onerror = function() {
          reject()
        }
      }
    });
  }

  put(storeName, object) {
    let connection = this.getIndexedDbConnection();
    return new Promise((resolve, reject) => {
      connection.onsuccess = function() {
        var db = this.result;
        var tx = db.transaction(storeName, 'readwrite');
        var store = tx.objectStore(storeName);
        store.put(object);
        resolve()
      }

      connection.onerror = function() {
        reject()
      }
    })
  }
}

export default new IndexedDbService()