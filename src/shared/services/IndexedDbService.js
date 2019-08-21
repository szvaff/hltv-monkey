class IndexedDbService {
  getIndexedDbConnection() {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
      return;
    }

    var connection = indexedDB.open('hltv-monkey', 2);

    connection.onerror = function() {
      console.log(this);
    }

    connection.onupgradeneeded = function () {
      var db = this.result;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('stats')) {
        db.createObjectStore('stats', { keyPath: 'id' });
      }
    }

    return connection;
  }
}

export default new IndexedDbService()