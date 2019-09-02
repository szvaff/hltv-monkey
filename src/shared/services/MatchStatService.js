import IndexedDbService from "./IndexedDbService";
import $ from 'jquery';
import HLTVMonkey from "./HLTVMonkey";

class MatchStatService {
  constructor() {}

  getMatchStats({ url, teamName }) {
    return new Promise(resolve => {
      var connection = IndexedDbService.getIndexedDbConnection();
      var self = this;
      connection.onsuccess = function() {
        var db = this.result;
        var tx = db.transaction('matchstats', 'readonly');
        var store = tx.objectStore('matchstats');
        var matchId = url.replace("https://www.hltv.org/stats/matches/mapstatsid/", "").split("/")[0];
        var readTx = store.get(matchId);
        readTx.onsuccess = function() {
          if (!this.result) {
            self.queryMapstat({ url, matchId }).then(stats => {
              resolve(stats[teamName])
            })
            return;
          }
          resolve(this.result.stats[teamName])
        }

        readTx.onerror = function() {
          self.queryMapstat({ url, matchId }).then(stats => {
            resolve(stats[teamName])
          })
        }
      }
    })
  }

  queryMapstat({ url, matchId }) {
    return new Promise(resolve => {
      HLTVMonkey.crawler.queue(url).then((doc) => {
        var el = $('<div></div>');
        el.html(doc);
        var tl = el.find("div.team-left img.team-logo").attr('alt');
        var tr = el.find("div.team-right img.team-logo").attr('alt');
        var stats = {}
        stats[tl] = {
          matchId,
          entries: this.getEntries(el, tl),
          clutchesLost: this.getClutchesLost(el, tl),
          clutchesWon: this.getClutchesWon(el, tl),
          teamRating: this.getTeamRating(el, tl),
          breakdown: this.getBreakdown(el, tl)
        }
        stats[tr] = {
          matchId,
          entries: this.getEntries(el, tr),
          clutchesLost: this.getClutchesLost(el, tr),
          clutchesWon: this.getClutchesWon(el, tr),
          teamRating: this.getTeamRating(el, tr),
          breakdown: this.getBreakdown(el, tr)
        }
        resolve(stats);
        this.storeMapstat(matchId, stats)
      })
    })
  }

  getBreakdown(el, teamName) {
    var tl = el.find("div.team-left img.team-logo").attr('alt');
    var left = false;
    if (tl === teamName) {
      left = true;
    }
    var breakdown = el.find("div.match-info-row:first").find('div.right');
    var breakdownNodes = Array.from(breakdown[0].childNodes)
    var toReturn = {}
    var firstHalfNode, secondHalfNode, enemyFirstHalfNode, enemySecondHalfNode;
    if(left) {
      firstHalfNode = breakdownNodes[4]
      enemyFirstHalfNode = breakdownNodes[6]
      secondHalfNode = breakdownNodes[8]
      enemySecondHalfNode = breakdownNodes[10]
    } else {
      enemyFirstHalfNode = breakdownNodes[4]
      firstHalfNode = breakdownNodes[6]
      enemySecondHalfNode = breakdownNodes[8]
      secondHalfNode = breakdownNodes[10]
    }

    toReturn.firstHalf = {
      score: parseInt(firstHalfNode.textContent),
      side: firstHalfNode.classList.contains('t-color') ? 'T' : 'CT',
      enemyScore: parseInt(enemyFirstHalfNode.textContent)
    }
    
    toReturn.secondHalf = {
      score: parseInt(secondHalfNode.textContent),
      side: secondHalfNode.classList.contains('t-color') ? 'T' : 'CT',
      enemyScore: parseInt(enemySecondHalfNode.textContent)
    }

    if (breakdownNodes[11].textContent !== " )") {
      var overtimeTxt = breakdownNodes[11].textContent.replace(' ) ( ', '').replace(' )', '')
      var overtimeScores = overtimeTxt.split(' : ')
      toReturn.overtime = {
        score: left ? parseInt(overtimeScores[0]) : parseInt(overtimeScores[1]),
        enemyScore: left ? parseInt(overtimeScores[1]) : parseInt(overtimeScores[0])
      }
    }

    return toReturn
  }

  getEntries(el, actualTeamName) {
    var tl = el.find("div.team-left img.team-logo").attr('alt');
    var left = false;
    if (tl === actualTeamName) {
      left = true;
    }

    var entries = el.find("div.match-info-row:nth(2)").text().trim();
    var entryNum;
    if(left) {
      entryNum = entries.substr(0, entries.indexOf(":"));
    } else {
      entryNum = entries.substr(entries.indexOf(":") + 1, 3);
    }
    return parseInt(entryNum);
  }

  getClutchesLost(el, actualTeamName) {
    var tl = el.find("div.team-left img.team-logo").attr('alt');
    var left = true;
    if (tl === actualTeamName) {
      left = false;
    }

    var clutches = el.find("div.match-info-row:nth(3)").text().trim();
    var clutchesLost;
    if(left) {
      clutchesLost = clutches.substr(0, clutches.indexOf(":"));
    } else {
      clutchesLost = clutches.substr(clutches.indexOf(":") + 1, 3);
    }
    return parseInt(clutchesLost);
  }

  getClutchesWon(el, actualTeamName) {
    var tl = el.find("div.team-left img.team-logo").attr('alt');
    var left = true;
    if (tl === actualTeamName) {
      left = false;
    }

    var clutches = el.find("div.match-info-row:nth(3)").text().trim();
    var clutchesWon;
    if(left) {
      clutchesWon = clutches.substr(clutches.indexOf(":") + 1, 3);
    } else {
      clutchesWon = clutches.substr(0, clutches.indexOf(":"));
    }
    return parseInt(clutchesWon);
  }

  getTeamRating(el, actualTeamName) {
    var tl = el.find("div.team-left img.team-logo").attr('alt');
    var left = true;
    if (tl === actualTeamName) {
      left = false;
    }

    var ratings = el.find("div.match-info-row:nth(1)").text().trim();
    var rating;
    if(left) {
      rating = ratings.substr(ratings.indexOf(":") + 1);
    } else {
      rating = ratings.substr(0, ratings.indexOf(":"));
    }
    return parseFloat(rating);
  }

  storeMapstat(matchId, stats) {
    var connection = IndexedDbService.getIndexedDbConnection();
    var self = this;
    connection.onsuccess = function() {
      var db = this.result;
      var tx = db.transaction('matchstats', 'readwrite');
      var store = tx.objectStore('matchstats');
      var readTx = store.get(`${matchId}`);
      readTx.onsuccess = readTx.onerror = function() {
        self.doStoreStats(this.result, stats, store, matchId);
      }
    }
  }

  doStoreStats(obj, stats, store, matchId) {
    obj = obj || { id: matchId };
    obj.stats = stats;
    store.put(obj);
  }
}

export default new MatchStatService()