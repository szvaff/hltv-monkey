import $ from 'jquery'
import { STYLES } from '../shared/constants';
import MatchDataService from '../shared/services/MatchDataService';
import IndexedDbService from '../shared/services/IndexedDbService';
import MatchStatService from '../shared/services/MatchStatService';
import { equals, getSettings } from '../shared/utils/common';

export default class TeamStats {

  constructor(result, urls, statsDiv, teamNum) {
    this.pastMatches = (function findPastMatches() {
      var tables = $(".past-matches table");
      return {
        team1: tables[0].innerHTML,
        team2: tables[1].innerHTML
      }
    })();

    return new Promise(resolve => {
      var overallStats = [];

      for (var i = 0; i < result.length; i++) {
        var el = $('<div></div>');
        el.html(result[i]);
        var themap = el.find("div.stats-top-menu-item.selected").text();
        var self = this;

        el.find("span:contains('Game changers')").each(function() {
          var parent = $(this).parent();
          $(this).html("<a target='_blank' href='" + urls[i] + "'>" + themap + "</a>");
          var next = $(this).parent().next();
          var graph = el.find("div.graph");
          var stats = el.find("div.stats-rows");

          overallStats.push({
            mapName: themap,
            timesPlayed: stats.find("span:contains('Times played')").siblings()[0].innerText,
            winPercent: stats.find("span:contains('Win percent')").siblings()[0].innerText
          });

          if (MatchDataService.maps.indexOf(themap) == -1) {
            return;
          }

          var results = el.find("table.stats-table");
          results.find("tr th.statsTeamMapEvent").remove();
          var hasLineup = false;

          if(results.find("tr th.statsTeamMapTeam1").length > 0) {
            hasLineup = true;
          }

          if (hasLineup) {
            results.find("tr th.statsTeamMapTeam1").remove();
            var lineupTds = results.find("tr td:nth-child(2)");
            lineupTds.each((i, e) => {
              var $e = $(e);
              $e.parent("tr").find("a").attr("data-teamname", $e.text());
            });
            lineupTds.remove();
            results.find("tr td:nth-child(3)").remove();
          } else {
            results.find("tr td:nth-child(3)").remove();
          }

          results.css(STYLES.RESULTS);
          results.find("tr td:nth-child(3)").css(STYLES.RESULTS_RESULT_TD);

          var moreInfoDiv = $("<div style='margin-top: 25px;text-align: center'></div>");
          self.prepareMoreInfoStats({ themap, teamNum, moreInfoDiv });
          var toAppend = $("<div class='mapstat " + themap + "' style='margin-top:10px'></div>").append(parent).append(stats).append(graph).append(next).append(moreInfoDiv).append(results);
          toAppend.find(".big-padding").css(STYLES.BIG_PADDING);
          toAppend.find(".large-strong").css(STYLES.LARGE_STRONG);

          statsDiv.append(toAppend);
          statsDiv.find(".stats-rows .stats-row").css(STYLES.STATS_ROW);
          statsDiv.find(".stats-rows .stats-row:nth-child(2n)").css(STYLES.STATS_ROW_EVEN);
          statsDiv.find(".stats-rows .strong").css(STYLES.STATS_ROW_STRONG);
          statsDiv.find(".stats-rows .stats-row>span:nth-child(2)").css(STYLES.STATS_ROW_VALUE);

          var graphData = graph.data("fusionchart-config");
          FusionCharts.ready(function () {
            new FusionCharts(graphData).render();
          });
        });
      }

      this.addOverallStats(overallStats, statsDiv);
      resolve()
    })
  }

  prepareMoreInfoStats({ themap, teamNum, moreInfoDiv }) {
    var connection = IndexedDbService.getIndexedDbConnection();
    var self = this;
    connection.onsuccess = function() {
      var db = this.result;
      var id = MatchDataService.getMatchId();
      var tx = db.transaction('teamstats', 'readonly');
      var store = tx.objectStore('teamstats');
      var team = "team" + teamNum;
      var readTx = store.get(`${id}-${team}-${themap}`);
      readTx.onsuccess = function() {
        if (!this.result) {
          self.addCollectDetailedMapStatsButton({ themap, teamNum, moreInfoDiv });
          return;
        }
        console.log(self.pastMatches)
        if (!equals(this.result.settings, getSettings())
          || !equals(this.result.pastMatches, self.pastMatches[team])) {
          self.addCollectDetailedMapStatsButton({ themap, teamNum, moreInfoDiv });
          return;
        }

        self.displayDetailedMapStats(this.result.stats, moreInfoDiv, themap, teamNum)
      }

      readTx.onerror = function() {
        self.addCollectDetailedMapStatsButton({ themap, teamNum, moreInfoDiv });
      }
    }
  }

  addCollectDetailedMapStatsButton({ themap, teamNum, moreInfoDiv }) {
    var self = this
    var $btn = $("<button id='entry_" + themap + "_" + teamNum + "'>Collect detailed map stats</button>");
    moreInfoDiv.append($btn);
    $btn.click(function() {
      var mapstatsurls = $(this).parent().siblings("table").find("a").filter((i, e) => e.href.indexOf("mapstatsid") > -1);
      var resultTds = $(this).parent().siblings("table").find("td.statsTeamMapResult");
      self.collectDetailedMapStats(mapstatsurls, $btn, resultTds, teamNum, themap)
    })
  }

  storeStats(stats, teamNum, themap) {
    var connection = IndexedDbService.getIndexedDbConnection();
    var self = this;
    connection.onsuccess = function() {
      var db = this.result;
      var team = "team" + teamNum;
      var matchId = MatchDataService.getMatchId();
      var tx = db.transaction('teamstats', 'readwrite');
      var store = tx.objectStore('teamstats');
      var readTx = store.get(`${matchId}-${team}-${themap}`);
      readTx.onsuccess = readTx.onerror = function() {
        self.doStoreStats(this.result, team, stats, store, themap);
      }
    }
  }

  doStoreStats(obj, team, stats, store, themap) {
    obj = obj || { id: `${MatchDataService.getMatchId()}-${team}-${themap}` };
    obj.stats = stats;
    obj.settings = getSettings();
    obj.pastMatches = this.pastMatches[team];
    store.put(obj);
  }

  addOverallStats(stats, statsDiv) {
    var id = "overall-" + new Date().getTime();
    statsDiv.prepend("<div id='" + id + "'></div>");
    var categories = [];
    var timesPlayedDataset = {
      seriesname: "Times Played",
      data: []
    };
    var mapWinPercentageDataset = {
      seriesname: "Won",
      data: []
    };

    for (var i = 0; i < stats.length; i++) {
      var stat = stats[i];
      categories.push({
        label: stat.mapName
      });
      var val = (stat.timesPlayed * parseFloat(stat.winPercent)/100);
      mapWinPercentageDataset.data.push({
        value: val.toFixed(0)
      });
      timesPlayedDataset.data.push({
        value: stat.timesPlayed
      });
    }

    FusionCharts.ready(function () {
      new FusionCharts({
        width: "100%",
        dataFormat: "json",
        type: "msbar2d",
        renderAt: id,
        containerBackgroundOpacity: 0,
        heightOverride: false,
        dataSource:{
          chart:{
            theme: "fint",
            showLabels: 1,
            showValues: 1,
            showPercentValues: 1,
            enableSmartLabels: 1,
            showPercentageInLabel: 1,
            labelDistance: 1,
            canvasBgAlpha: 0,
            labelFontColor: "#7d7d7d",
            baseFontColor: "#7d7d7d",
            logoAlpha: 20,
            logoScale: 50,
            logoPosition: "TR",
            bgAlpha: 0,
            borderAlpha: 0,
            showShadow: 0,
            use3DLighting: 1,
            animation: 0
          },
          categories: [{
            category: categories}],
          dataset: [
            timesPlayedDataset,
            mapWinPercentageDataset
          ]
        }
      }).render();
    });
  }

  collectDetailedMapStats(mapstatsurls, $btn, resultTds, teamNum, themap) {
    var numAll = mapstatsurls.length;
    var numDone = 0;
    $btn.parent().append("<div class='team_entries'>" + numDone + "/" + numAll + "</div>");
    var $teamEntries = $btn.parent().find("div.team_entries");
    $btn.remove();
    var promises = [];
    mapstatsurls.each((i, e) => {
      var queryPromise = this.queryMapstat(e);
      promises.push(queryPromise);
      queryPromise.then(() => { $teamEntries.text(++numDone + "/" + numAll) });
    })

    var roundsPlayed = 0;
    resultTds.each((i, td) => {
      var txt = $(td).text();
      var rounds = txt.split("-");
      rounds = parseInt(rounds[0]) + parseInt(rounds[1]);
      roundsPlayed += rounds;
    });

    Promise.all(promises).then(values => {
      var stats = {
        stats: values,
        roundsPlayed,
        mapsPlayed: mapstatsurls.length
      }
      this.displayDetailedMapStats(stats, $teamEntries.parent(), themap, teamNum)
      this.storeStats(stats, teamNum, themap)
    })
  }

  displayDetailedMapStats(values, $target, map, teamNum) {
    let $table = $target.siblings("table")
    var sum = {
      entries: 0,
      clutchesLost: 0,
      clutchesWon: 0,
      teamRating: 0,
      ctStartingRounds: [],
      tStartingRounds: []
    }
    for (var item in values.stats) {
      var e = values.stats[item]
      sum.entries += e.entries;
      sum.clutchesLost += e.clutchesLost;
      sum.clutchesWon += e.clutchesWon;
      sum.teamRating += e.teamRating;
      e.breakdown.firstHalf.side === "CT" ? sum.ctStartingRounds.push(e.breakdown.firstHalf.score) : sum.tStartingRounds.push(e.breakdown.firstHalf.score)
      this.displayMapHalfScores(e, $table)
    }
    this.addDisplayMapScoreBreakdownsCheckbox($table, map, teamNum);
    $target.html("<div id='monkey_entries' class='columns'></div><div id='monkey_clutches' class='columns' style='margin-top: 25px'></div><div class='columns' id='monkey_avgstartingrounds' style='margin-top: 25px'></div>");
    var $teamEntriesColumnsDiv = $target.find("div#monkey_entries");
    var $teamClutchesColumnsDiv = $target.find("div#monkey_clutches");
    var $avgStartingRounds = $target.find("div#monkey_avgstartingrounds");
    this.displayEntryStats($teamEntriesColumnsDiv, sum.entries, values.roundsPlayed);
    this.displayTeamRating($teamEntriesColumnsDiv, sum.teamRating, values.mapsPlayed);
    this.displayClutchesLost($teamClutchesColumnsDiv, sum.clutchesLost, values.mapsPlayed);
    this.displayClutchesWon($teamClutchesColumnsDiv, sum.clutchesWon, values.mapsPlayed);
    this.displayAvgStartingRounds($avgStartingRounds, sum.ctStartingRounds, 'CT', 'color: #0091d4;');
    this.displayAvgStartingRounds($avgStartingRounds, sum.tStartingRounds, 'T', 'color: #fab200;');
  }

  displayAvgStartingRounds($target, rounds, side, color) {
    const avgRounds = rounds.reduce((pv, v) => pv + v, 0)/rounds.length
    this.displayStat($target, avgRounds.toFixed(2), `Avg. rounds when starting as ${side} (${rounds.length} matches)`, color);
  }

  displayClutchesLost($teamEntriesDiv, sum, mapsPlayed) {
    var clutchesLostPerMatch = (sum/mapsPlayed).toFixed(1);
    this.displayStat($teamEntriesDiv, clutchesLostPerMatch, "Avg. clutches lost per map");
  }

  addDisplayMapScoreBreakdownsCheckbox($table, map, teamNum) {
    let id = `monkey_toggle_breakdown_${map}_team${teamNum}`
    $(`<div style="margin: 25px auto;text-align: center;"><input id='${id}' type='checkbox' /><label for='${id}'>Display map score breakdowns</label></div>`).insertBefore($table)
    $(`#${id}`).change(function() {
      var val = $(this).is(":checked");
      let breakdownDivs = $table.find(".monkey-match-breakdown")
      val ? breakdownDivs.css("display", "block") : breakdownDivs.css("display", "none")
    });
  }

  displayMapHalfScores (match, $target) {
    let tr = this.findMatchRowInTable(match.matchId, $target)
    let $td = $(tr).find("td:nth(2)")
    let breakdown = match.breakdown
    let otHtml = "";
    if (breakdown.overtime) {
      otHtml = `|${breakdown.overtime.score}:${breakdown.overtime.enemyScore}`
    }
    $td.append(`<div class="monkey-match-breakdown stats-section stats-match" style="display:none;"><span class="${breakdown.firstHalf.side.toLowerCase()}-color">${breakdown.firstHalf.score}</span>:<span>${breakdown.firstHalf.enemyScore}</span>|<span class="${breakdown.secondHalf.side.toLowerCase()}-color">${breakdown.secondHalf.score}</span>:<span>${breakdown.secondHalf.enemyScore}</span>${otHtml}</div>`)
  }

  findMatchRowInTable(matchId, $table) {
    var $timeTds = $table.find("td.time").toArray()
    for (var i in $timeTds) {
      var td = $timeTds[i]
      var a = $(td).find("a")[0]
      if (a.href.indexOf(matchId) !== -1) {
        return $(td).parent("tr")
      }
    }
  }

  displayTeamRating($teamEntriesDiv, sum, mapsPlayed) {
    var rating = (sum/mapsPlayed).toFixed(2);
    this.displayStat($teamEntriesDiv, rating, "Avg. team rating");
  }

  displayClutchesWon($teamEntriesDiv, sum, mapsPlayed) {
    var clutchesWonPerMatch = (sum/mapsPlayed).toFixed(1);
    this.displayStat($teamEntriesDiv, clutchesWonPerMatch, "Avg. clutches won per map");
  }

  displayClutchesLost($teamEntriesDiv, sum, mapsPlayed) {
    var clutchesLostPerMatch = (sum/mapsPlayed).toFixed(1);
    this.displayStat($teamEntriesDiv, clutchesLostPerMatch, "Avg. clutches lost per map");
  }

  displayEntryStats($teamEntriesDiv, sum, roundsPlayed) {
    var entrySuccess = (sum/roundsPlayed*100).toFixed(1);
    this.displayStat($teamEntriesDiv, entrySuccess + "%", "Entry success percent based on rounds played");
  }

  displayStat($teamEntriesDiv, num, str, colorCss) {
    $teamEntriesDiv.append(`
      <div class="col standard-box big-padding" style="padding: 5px 10px; font-size: 10px;text-align:left;">
        <div class="large-strong" style="font-size: 12px; font-weight: bold;${colorCss}">${num}</div>
        <div class="small-label-below">${str}</div>
      </div>
    `);
  }

  queryMapstat(anchor) {
    return MatchStatService.getMatchStats({ 
      url: anchor.href,
      teamName: $(anchor).data("teamname")
    })
  }
}