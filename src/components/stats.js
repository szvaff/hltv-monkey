import $ from 'jquery'
import HLTVMonkey from "../shared/services/HLTVMonkey";
import SettingsService from "../shared/services/SettingsService";
import IndexedDbService from "../shared/services/IndexedDbService";
import MatchDataService from "../shared/services/MatchDataService";
import { ALL_MAPS, STATS_DIV, STYLES } from "../shared/constants";
import { equals, getSettings } from '../shared/utils/common'
import TeamStats from './team-stats';
import { OverUnderStats } from './over-under-stats';

export class Stats {
  constructor() {
    this.$statsDiv1 = null
    this.$statsDiv2 = null
    this.$overUnderDiv = $("<div id='monkey_over_under' class='columns'></div>")
    this.t1Done = 0
    this.t2Done = 0
    this.$mapChanger = $("<div class='stats-section'></div>");
    this.selectedMap = null
    this.init()
  }

  init() {
    var self = this
    HLTVMonkey.vetoBox.append("<button id='statsbtn'>Stats</button>");
    HLTVMonkey.vetoBox.append("<button id='onlinestatsbtn'>Stats [Online]</button>");
    HLTVMonkey.vetoBox.append("<button id='lanstatsbtn'>Stats [LAN]</button>");

    $("#statsbtn").click(function() {
      self.startStatsQuery();
    });

    $("#onlinestatsbtn").click(function() {
      self.startStatsQuery("Online");
    });
    
    $("#lanstatsbtn").click(function() {
      self.startStatsQuery("Lan");
    });

    this.pastMatches = (function findPastMatches() {
      var tables = $(".past-matches table");
      return {
        team1: tables[0].innerHTML,
        team2: tables[1].innerHTML
      }
    })();
  }

  startStatsQuery(matchType) {
    this.clean();
    SettingsService.matchType = matchType;
    this.queryStats();
    this.addMapChanger();
  }

  queryStats() {
    if (MatchDataService.maps.length === 0) {
      MatchDataService.maps = ALL_MAPS;
    }
    var connection = IndexedDbService.getIndexedDbConnection();
    this.prepareStatsDivs();
    var self = this;
    connection.onsuccess = function() {
      var db = this.result;
      var id = MatchDataService.getMatchId();
      var tx = db.transaction('stats', 'readonly');
      var store = tx.objectStore('stats');
      var readTx = store.get(id);
      readTx.onsuccess = function() {
        if (!this.result) {
          self.doQueryStats();
          return;
        }

        if (!equals(this.result.settings, getSettings())
          || !equals(this.result.pastMatches.team1, self.pastMatches.team1)
          || !equals(this.result.pastMatches.team2, self.pastMatches.team2)) {
          self.doQueryStats();
          return;
        }

        self.$statsDiv1.find("#progress").remove();
        self.$statsDiv2.find("#progress").remove();
        var urls1 = [];
        var urls2 = [];
        for (var i = 0; i < ALL_MAPS.length; i++) {
          var map = ALL_MAPS[i];
          var url1 = MatchDataService.getLineupStatsUrlForMap(MatchDataService.playersTeam1, map);
          var url2 = MatchDataService.getLineupStatsUrlForMap(MatchDataService.playersTeam2, map);
          urls1.push(url1);
          urls2.push(url2);
        }
        new TeamStats(this.result.stats.team1, urls1, self.$statsDiv1, 1).then(self.showMapStats());
        new TeamStats(this.result.stats.team2, urls2, self.$statsDiv2, 2).then(self.showMapStats());
      }

      readTx.onerror = function() {
        self.doQueryStats();
      }
    }
  }

  prepareStatsDivs() {
    this.$statsDiv1 = $(STATS_DIV);
    this.$statsDiv2 = $(STATS_DIV);
    const $statsContainer = $(".g-grid.maps");
    $statsContainer.append(this.$overUnderDiv);
    $statsContainer.append(this.$statsDiv1);
    $statsContainer.append(this.$statsDiv2);
    new OverUnderStats(this.$overUnderDiv)
  }

  clean() {
    this.$statsDiv1 && this.$statsDiv1.remove();
    this.$statsDiv2 && this.$statsDiv2.remove();
  }

  showMapStats(which) {
    which = which || this.selectedMap
    $(".mapstat").css("display", "none");
    $(".mapstat." + which).css("display", "inline-block");

    $(".mapstat-changer").css(STYLES.INACTIVE_MAP_CHANGER_ITEM);
    $(".mapstat-changer." + which).css(STYLES.ACTIVE_MAP_CHANGER_ITEM);
  }

  addMapChanger() {
    this.selectedMap = MatchDataService.maps[0];

    if (MatchDataService.maps.length < 2 || $(".mapstat-changer").length > 0) {
      return;
    }

    var width = 100/MatchDataService.maps.length;
    var self = this;

    for (var item in MatchDataService.maps) {
      var $map = $("<div class='mapstat-changer stats-top-menu-item " + MatchDataService.maps[item] + "'>" + MatchDataService.maps[item] + "</div>");
      $map.css("width", width + "%");
      $map.css(STYLES.MAP_CHANGER_ITEM);

      $map.click(function() {
        self.showMapStats($(this).text());
      });

      this.$mapChanger.append($map);
    }

    this.$mapChanger.css(STYLES.MAP_CHANGER);
    this.$mapChanger.insertBefore(this.$statsDiv1);
  }

  doQueryStats() {
    var urlPromises1 = [];
    var urlPromises2 = [];
    var urls1 = [];
    var urls2 = [];
    this.t1Done = 0;
    this.t2Done = 0;
    for (var i = 0; i < ALL_MAPS.length; i++) {
      var map = ALL_MAPS[i];
      var url1 = MatchDataService.getLineupStatsUrlForMap(MatchDataService.playersTeam1, map);
      var url2 = MatchDataService.getLineupStatsUrlForMap(MatchDataService.playersTeam2, map);
      urls1.push(url1);
      urls2.push(url2);
      var p1 = HLTVMonkey.crawler.queue(url1);
      var p2 = HLTVMonkey.crawler.queue(url2);
      urlPromises1.push(p1);
      urlPromises2.push(p2);

      p1.then(() => {
        this.progress(this.$statsDiv1.find("#progress"), ++this.t1Done);
      });

      p2.then(() => {
        this.progress(this.$statsDiv2.find("#progress"), ++this.t2Done);
      });
    }

    Promise.all(urlPromises1).then((result) => {
      new TeamStats(result, urls1, this.$statsDiv1, 1).then(this.showMapStats());
      this.storeStats(result, 1);
      this.$statsDiv1.find("#progress").remove();
    }).catch((e) => {
      this.$statsDiv1.find("#progress").html("Error occured.");
      console.log(e)
    });

    Promise.all(urlPromises2).then((result) => {
      new TeamStats(result, urls2, this.$statsDiv2, 2).then(this.showMapStats());
      this.storeStats(result, 2);
      this.$statsDiv2.find("#progress").remove();
    }).catch((e) => {
      this.$statsDiv2.find("#progress").html("Error occured.");
      console.log(e)
    });
  }

  storeStats(stats, teamNum) {
    var connection = IndexedDbService.getIndexedDbConnection();
    var self = this;
    connection.onsuccess = function() {
      var db = this.result;
      var team = "team" + teamNum;
      var matchId = MatchDataService.getMatchId();
      var tx = db.transaction('stats', 'readwrite');
      var store = tx.objectStore('stats');
      var readTx = store.get(matchId);
      readTx.onsuccess = readTx.onerror = function() {
        self.doStoreStats(this.result, team, stats, store);
      }
    }
  }

  doStoreStats(obj, team, stats, store) {
    obj = obj || { id: MatchDataService.getMatchId() };
    obj.stats = obj.stats || {};
    obj.stats[team] = stats;
    obj.settings = getSettings();
    obj.pastMatches = obj.pastMatches || {};
    obj.pastMatches[team] = this.pastMatches[team];
    store.put(obj);
  }

  progress($div, done) {
    var percentage = (done / ALL_MAPS.length * 100).toFixed(0) + "%";
    $div.find("#percentage").text(percentage);
    $div.find("#line").width(percentage);
  }
}