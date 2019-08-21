import $ from 'jquery'
import { STYLES } from '../shared/constants';
import MatchDataService from '../shared/services/MatchDataService';
import HLTVMonkey from '../shared/services/HLTVMonkey';


export default class TeamStats {

  constructor(result, urls, statsDiv, teamNum) {
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

          var earlyAndLateDiv = $("<div style='margin-top: 25px;text-align: center'></div>");
          var $earlyLateBtn = $("<button id='entry_" + themap + "_" + teamNum + "'>Collect early and late round stats</button>");
          earlyAndLateDiv.append($earlyLateBtn);
          $earlyLateBtn.click(function() {
            var mapstatsurls = $(this).parent().siblings("table").find("a").filter((i, e) => e.href.indexOf("mapstatsid") > -1);
            var resultTds = $(this).parent().siblings("table").find("td.statsTeamMapResult");
            self.collectEarlyAndLateRoundStats(mapstatsurls, $earlyLateBtn, resultTds)
          })

          var toAppend = $("<div class='mapstat " + themap + "' style='margin-top:10px'></div>").append(parent).append(stats).append(graph).append(next).append(earlyAndLateDiv).append(results);
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

  collectEarlyAndLateRoundStats(mapstatsurls, $btn, resultTds) {
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
      var sum = {
        entries: 0,
        clutchesLost: 0,
        clutchesWon: 0,
        teamRating: 0
      }
      values.forEach(e => {
        sum.entries += e.entries;
        sum.clutchesLost += e.clutchesLost;
        sum.clutchesWon += e.clutchesWon;
        sum.teamRating += e.teamRating;
      })
      $teamEntries.html("<div id='monkey_entries' class='columns'></div><div id='monkey_clutches' class='columns' style='margin-top: 25px'></div>");
      var $teamEntriesColumnsDiv = $teamEntries.find("div#monkey_entries");
      var $teamClutchesColumnsDiv = $teamEntries.find("div#monkey_clutches");
      this.displayEntryStats($teamEntriesColumnsDiv, sum.entries, roundsPlayed);
      this.displayTeamRating($teamEntriesColumnsDiv, sum.teamRating, mapstatsurls.length);
      this.displayClutchesLost($teamClutchesColumnsDiv, sum.clutchesLost, mapstatsurls.length);
      this.displayClutchesWon($teamClutchesColumnsDiv, sum.clutchesWon, mapstatsurls.length);
    })
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

  displayStat($teamEntriesDiv, num, str) {
    $teamEntriesDiv.append(`
      <div class="col standard-box big-padding" style="padding: 5px 10px; font-size: 10px;text-align:left;">
        <div class="large-strong" style="font-size: 12px; font-weight: bold;">${num}</div>
        <div class="small-label-below">${str}</div>
      </div>
    `);
  }

  queryMapstat(anchor) {
    return new Promise(resolve => {
      HLTVMonkey.crawler.queue(anchor.href).then((doc) => {
        var el = $('<div></div>');
        var teamname = $(anchor).data("teamname");
        el.html(doc);
        resolve({
          entries: this.getEntries(el, teamname),
          clutchesLost: this.getClutchesLost(el, teamname),
          clutchesWon: this.getClutchesWon(el, teamname),
          teamRating: this.getTeamRating(el, teamname)
        });
      })
    })
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

}