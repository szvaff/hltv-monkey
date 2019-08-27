import $ from 'jquery'
import IndexedDbService from '../shared/services/IndexedDbService';
import { STYLES } from '../shared/constants';
import MatchDataService from '../shared/services/MatchDataService';
import HLTVMonkey from '../shared/services/HLTVMonkey';

export class Notepad {
  constructor () {
    var connection = IndexedDbService.getIndexedDbConnection();
    connection.onsuccess = function () {
      var db = this.result;
      HLTVMonkey.vetoBox.append('<div id="notepad-wrapper" class="padding"><div>Notes</div><textarea id="notepad"></textarea></div>')
      // $("#notepad-wrapper").css(STYLES.NOTEPAD_WRAPPER);
      $("#notepad").css(STYLES.NOTEPAD);

      var id = MatchDataService.getMatchId();
      var tx = db.transaction('notes', 'readonly');
      var store = tx.objectStore('notes');
      var readTx = store.get(id);
      readTx.onsuccess = function() {
        var obj = this.result;
        obj && $("#notepad").val(obj.note);
      }

      $("#notepad").change(function() {
        var value = $("#notepad").val();
        var item = {
          id: id,
          note: value
        };
        var tx = db.transaction('notes', 'readwrite');
        var store = tx.objectStore('notes');
        store.put(item);
      })
    }
  }
}