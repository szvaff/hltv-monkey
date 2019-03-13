// ==UserScript==
// @name         HLTV Monkey
// @namespace    https://www.hltv.org/matches/*
// @version      1.2.1
// @description  Script to load team statistics in one click and more
// @author       sZVAFF
// @match        https://www.hltv.org/matches/*
// @require http://code.jquery.com/jquery-latest.js
// ==/UserScript==

function Crawler() {
    var queue = [];
    var inProgress = null;

    Crawler.prototype.queue = function(url) {
        var toResolveLater = null;
        var promise = new Promise((resolve, reject) => {
            toResolveLater = resolve;
        });

        queue.push({
            url: url,
            promise: promise,
            resolve: toResolveLater
        })

        next();
        return promise;
    }

    function next() {
        return new Promise(resolve => {
            setTimeout(() => {
                if(inProgress !== null) {
                    inProgress.promise.then(() => {
                        next();
                    })
                    return;
                }

                if (queue.length === 0) {
                    resolve();
                    return;
                }

                inProgress = queue[0];
                $.get(inProgress.url).then(result => {
                    resolve(result);
                    inProgress.resolve(result);
                    queue.splice(0,1);
                    inProgress = null;
                })
            }, Math.floor(Math.random()*2000))
        })
    }

    return this;
}

(function() {
    'use strict';

    var MAP_ID = {
        Cache: 29,
        Inferno: 33,
        Mirage: 32,
        Nuke: 34,
        Overpass: 40,
        Train: 35,
        Dust2: 31
    };

    var ALL_MAPS = ["Cache", "Inferno", "Mirage", "Nuke", "Overpass", "Train", "Dust2"];

    var STYLES = {
        BIG_PADDING: {
            'padding': '5px 10px',
            'font-size': '10px'
        },
        LARGE_STRONG: {
            'font-size': '12px',
            'font-weight': 'bold'
        },
        STATS_ROW: {
            'padding': '5px 10px'
        },
        STATS_ROW_EVEN: {
            'background-color': '#f6f6f9'
        },
        STATS_ROW_STRONG: {
            'font-weight': 'bold'
        },
        STATS_ROW_VALUE: {
            'float': 'right'
        },
        MAP_CHANGER: {
            'width' : '100%',
            'font-size': '0',
            'background-color': '#fff',
            'margin-top': "10px"
        },
        MAP_CHANGER_ITEM: {
            'display': 'inline-block',
            'font-size': '12px',
            'text-align': 'center',
            'cursor': 'pointer'
        },
        ACTIVE_MAP_CHANGER_ITEM: {
            'font-weight': 'bold',
            'color': '#2d6da3;',
            'box-shadow': 'inset 0 -3px 0 0 #2d6da3'
        },
        INACTIVE_MAP_CHANGER_ITEM: {
            'font-weight': '',
            'color': '',
            'box-shadow': ''
        },
        HEADLINE_BOX: {
            'position' : 'relative'
        },
        MATCHES_URL: {
            'position' : 'absolute',
            'right': '10px'
        },
        RESULTS: {
            'margin-top': '25px'
        },
        RESULTS_RESULT_TD: {
            'text-align': 'center'
        },
        NOTEPAD_WRAPPER: {
            'margin-top': '10px'
        },
        NOTEPAD: {
            'width': '100%',
            'padding': '0'
        }
    };

    var STATS_DIV = "<div style='display: inline-block; max-width: 45%; padding:5px;'></div>";
    var MIN_LINEUP_MATCH = 4;
    var MATCH_TYPE;
    var DAYS = 90;
    var URL_PREFIX_LINEUP_STATS = "https://www.hltv.org/stats/lineup/map/";
    var URL_PREFIX_LINEUP_MATCHES = "https://www.hltv.org/stats/lineup/matches/";

    var $mapChanger = $("<div class='stats-section'></div>");
    var vetoBox = $("div.veto-box:first");
    var unixDate = new Date(parseInt($("div.date").attr("data-unix")));
    var lineupsDivs = $("div.lineups div.lineup");
    var playersTeam1 = $(lineupsDivs[0]).find(".players").find("td.player a");
    var playersTeam2 = $(lineupsDivs[1]).find(".players").find("td.player a");
    var team1 = $("div.teamName")[0].innerText;
    var team2 = $("div.teamName")[1].innerText;
    var $statsDiv1;
    var $statsDiv2;
    var maps = [];
    var selectedMap = null;
    var tba = false;
    var matchId = null;
    var minusDays = 0;
    var crawler = new Crawler();

    $("div.mapholder div.mapname").each(function(index, el) {
        if (el.innerText !== "TBA") {
            maps.push(el.innerText);
        } else {
            tba = true;
        }
    });

    function getDateFilter() {
        var to = unixDate;
        to.setDate(to.getDate() - minusDays);
        var from = new Date(unixDate.getTime());
        from.setDate(from.getDate() - DAYS - minusDays);
        return "startDate=" + (from.getFullYear()) + "-" + (from.getMonth()+1 < 10 ? "0" :"") + (from.getMonth()+1) + "-" + (from.getDate() < 10 ? "0" :"") + from.getDate() + "&endDate=" + to.getFullYear() + "-" + (to.getMonth()+1 < 10 ? "0" :"") + (to.getMonth()+1) + "-" + (to.getDate() < 10 ? "0" :"") + to.getDate();
    }

    function clean() {
        if ($statsDiv1) {
            $statsDiv1.remove();
        }

        if ($statsDiv2) {
            $statsDiv2.remove();
        }
    }

    function addStatsButton() {
        if (vetoBox.length === 0) {
            $('<div class="standard-box veto-box"></div>').insertBefore($("div.mapholder").parent());
            vetoBox = $("div.veto-box:first");
        }
        vetoBox.append("<div><input type='checkbox' id='exclude_matchday' /><label for='exclude_matchday'>Exclude matchday</label></div>");
        vetoBox.append("<button id='statsbtn'>Stats</button>");

        $("#statsbtn").click(function() {
            startStatsQuery();
        });

        $("#exclude_matchday").change(function() {
            var val = $(this).is(":checked");
            val ? minusDays = 1 : minusDays = 0;
        })
    }

    function addOnlineStatsButton() {
        vetoBox.append("<button id='onlinestatsbtn'>Stats [Online]</button>");

        $("#onlinestatsbtn").click(function() {
            startStatsQuery("Online");
        });
    }

    function addLanStatsButton() {
        vetoBox.append("<button id='lanstatsbtn'>Stats [LAN]</button>");

        $("#lanstatsbtn").click(function() {
            startStatsQuery("Lan");
        });
    }

    function startStatsQuery(matchType) {
        clean();
        MATCH_TYPE = matchType;
        queryStats();
        addMapChanger();
    }

    function getLineupStatsUrlForMap(playersTeam, map) {
        var baseUrl = URL_PREFIX_LINEUP_STATS + MAP_ID[map] + "?";
        for (var i = 0; i < 5; i++) {
            var href1 = playersTeam[i].href.substring(playersTeam[i].href.indexOf("/player/") + "/player/".length, playersTeam[i].href.lastIndexOf("/"));
            baseUrl += "lineup=" + href1 + "&";
        }

        return baseUrl + "minLineupMatch=" + MIN_LINEUP_MATCH + "&" + getDateFilter() + ( MATCH_TYPE == null ? "" : "&matchType=" + MATCH_TYPE);
    }

    function getLineupMatchesUrl(playersTeam) {
        var baseUrl = URL_PREFIX_LINEUP_MATCHES + "?";
        for (var i = 0; i < 5; i++) {
            var href1 = playersTeam[i].href.substring(playersTeam[i].href.indexOf("/player/") + "/player/".length, playersTeam[i].href.lastIndexOf("/"));
            baseUrl += "lineup=" + href1 + "&";
        }

        return baseUrl + "minLineupMatch=" + MIN_LINEUP_MATCH + "&" + getDateFilter() + ( MATCH_TYPE == null ? "" : "&matchType=" + MATCH_TYPE);
    }

    function addCopyButton() {
        vetoBox.append("<button id='copybtn'>copy</button>");

        $("#copybtn").click(function() {
            var dateString = unixDate.getFullYear() + "/" + ((unixDate.getMonth()+1) < 10 ? "0" : "") + (unixDate.getMonth()+1) + "/" + unixDate.getDate() + " " + unixDate.getHours() + ":" + (unixDate.getMinutes() < 10 ? "0" : "") + unixDate.getMinutes();
            var event = $("div.event").text();

            var format = "BO3";
            if (vetoBox.text().indexOf("Best of 1") > 0) {
                if (tba) {
                    format = "BO1";
                } else {
                    format = maps[0];
                }
            }

            if (vetoBox.text().indexOf("Best of 2") > 0) {
                format = "BO2";
            }

            var teams = team1 + " vs " + team2;
            var txtArea = $("<textarea></textarea>");
            txtArea.text(dateString + "\t" + event + "\t" + teams + "\t" + format);
            $("body").append(txtArea);
            txtArea.select();
            document.execCommand('copy');
            txtArea.remove();
        });
    }

    function queryStats() {
        if (maps.length === 0) {
            maps = ALL_MAPS;
        }

        var urlPromises1 = [];
        var urlPromises2 = [];
        var urls1 = [];
        var urls2 = [];
        for (var i = 0; i < ALL_MAPS.length; i++) {
            var map = ALL_MAPS[i];
            var url1 = getLineupStatsUrlForMap(playersTeam1, map);
            var url2 = getLineupStatsUrlForMap(playersTeam2, map);
            urls1.push(url1);
            urls2.push(url2);
            urlPromises1.push($.get(url1));
            urlPromises2.push($.get(url2));
        }

        $statsDiv1 = $(STATS_DIV);
        $statsDiv2 = $(STATS_DIV);
        var $statsContainer = $(".flexbox.fix-half-width-margin.maps");
        $statsContainer.append($statsDiv1);
        $statsContainer.append($statsDiv2);

        Promise.all(urlPromises1).then(function(result) {
            appendStats(result, urls1, $statsDiv1, 1);
        });

        Promise.all(urlPromises2).then(function(result) {
            appendStats(result, urls2, $statsDiv2, 2);
        });
    }

    function addMapChanger() {
        selectedMap = maps[0];

        if (maps.length < 2 || $(".mapstat-changer").length > 0) {
            return;
        }

        var width = 100/maps.length;

        for (var item in maps) {
            var $map = $("<div class='mapstat-changer stats-top-menu-item " + maps[item] + "'>" + maps[item] + "</div>");
            $map.css("width", width + "%");
            $map.css(STYLES.MAP_CHANGER_ITEM);

            $map.click(function() {
                showMapStats($(this).text());
            });

            $mapChanger.append($map);
        }

        $mapChanger.css(STYLES.MAP_CHANGER);
        $mapChanger.insertBefore($statsDiv1);
    }

    function addMatchesLinks() {
        var headLineBoxes = $(".lineup .box-headline");
        headLineBoxes.css(STYLES.HEADLINE_BOX);

        var url1 = getLineupMatchesUrl(playersTeam1);
        var link1 = $("<a target='_blank' href='" + url1 + "'>Matches... </a>");
        link1.css(STYLES.MATCHES_URL);
        $(headLineBoxes[0]).append(link1);

        var url2 = getLineupMatchesUrl(playersTeam2);
        var link2 = $("<a target='_blank' href='" + url2 + "'>Matches... </a>");
        link2.css(STYLES.MATCHES_URL);
        $(headLineBoxes[1]).append(link2);
    }

    function showMapStats(which) {
        $(".mapstat").css("display", "none");
        $(".mapstat." + which).css("display", "inline-block");

        $(".mapstat-changer").css(STYLES.INACTIVE_MAP_CHANGER_ITEM);
        $(".mapstat-changer." + which).css(STYLES.ACTIVE_MAP_CHANGER_ITEM);
    }

    function appendStats(result, urls, statsDiv, teamNum) {
        var overallStats = [];

        for (var i = 0; i < result.length; i++) {
            var el = $('<div></div>');
            var doc = el.html(result[i]);
            var themap = el.find("div.stats-top-menu-item.selected").text();

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

                if (maps.indexOf(themap) == -1) {
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
                    collectEarlyAndLateRoundStats(mapstatsurls, $earlyLateBtn, resultTds)
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

        addOverallStats(overallStats, statsDiv);
        showMapStats(selectedMap);
    }

    function collectEarlyAndLateRoundStats(mapstatsurls, $btn, resultTds) {
        var numAll = mapstatsurls.length;
        var numDone = 0;
        $btn.parent().append("<div class='team_entries'>" + numDone + "/" + numAll + "</div>");
        var $teamEntries = $btn.parent().find("div.team_entries");
        $btn.remove();
        var promises = [];
        mapstatsurls.each((i, e) => {
            var queryPromise = queryMapstat(e);
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
            displayEntryStats($teamEntriesColumnsDiv, sum.entries, roundsPlayed);
            displayTeamRating($teamEntriesColumnsDiv, sum.teamRating, mapstatsurls.length);
            displayClutchesLost($teamClutchesColumnsDiv, sum.clutchesLost, mapstatsurls.length);
            displayClutchesWon($teamClutchesColumnsDiv, sum.clutchesWon, mapstatsurls.length);
        })
    }

    function displayTeamRating($teamEntriesDiv, sum, mapsPlayed) {
        var rating = (sum/mapsPlayed).toFixed(1);
        displayStat($teamEntriesDiv, rating, "Avg. team rating");
    }

    function displayClutchesWon($teamEntriesDiv, sum, mapsPlayed) {
        var clutchesWonPerMatch = (sum/mapsPlayed).toFixed(1);
        displayStat($teamEntriesDiv, clutchesWonPerMatch, "Avg. clutches won per map");
    }

    function displayClutchesLost($teamEntriesDiv, sum, mapsPlayed) {
        var clutchesLostPerMatch = (sum/mapsPlayed).toFixed(1);
        displayStat($teamEntriesDiv, clutchesLostPerMatch, "Avg. clutches lost per map");
    }

    function displayEntryStats($teamEntriesDiv, sum, roundsPlayed) {
        var entrySuccess = (sum/roundsPlayed*100).toFixed(1);
        displayStat($teamEntriesDiv, entrySuccess + "%", "Entry success percent based on rounds played");
    }

    function displayStat($teamEntriesDiv, num, str) {
        $teamEntriesDiv.append(`
             <div class="col standard-box big-padding" style="padding: 5px 10px; font-size: 10px;text-align:left;">
                <div class="large-strong" style="font-size: 12px; font-weight: bold;">${num}</div>
                <div class="small-label-below">${str}</div>
             </div>
        `);
    }

    function queryMapstat(anchor) {
        return new Promise(resolve => {
            crawler.queue(anchor.href).then((doc) => {
                var el = $('<div></div>');
                var teamname = $(anchor).data("teamname");
                el.html(doc);
                resolve({
                    entries: getEntries(el, teamname),
                    clutchesLost: getClutchesLost(el, teamname),
                    clutchesWon: getClutchesWon(el, teamname),
                    teamRating: getTeamRating(el, teamname)
                });
            })
        })
    }

    function getEntries(el, actualTeamName) {
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

    function getClutchesLost(el, actualTeamName) {
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

    function getClutchesWon(el, actualTeamName) {
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

    function getTeamRating(el, actualTeamName) {
        var tl = el.find("div.team-left img.team-logo").attr('alt');
        var left = true;
        if (tl === actualTeamName) {
            left = false;
        }

        var ratings = el.find("div.match-info-row:nth(1)").text().trim();
        var rating;
        if(left) {
            rating = ratings.substr(ratings.indexOf(":") + 1, 3);
        } else {
            rating = ratings.substr(0, ratings.indexOf(":"));
        }
        return parseFloat(rating);
    }

    function addOverallStats(stats, statsDiv) {
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
                        category: [categories]}],
                    dataset: [
                        timesPlayedDataset,
                        mapWinPercentageDataset
                    ]
                }
            }).render();
        });
    }

    function getMatchId() {
        if (matchId !== null) {
            return matchId;
        }

        matchId = window.location.href.replace("https://www.hltv.org/matches/", "").split("/")[0];
        return matchId;
    }

    function addNotepad() {
        if (!('indexedDB' in window)) {
            console.log('This browser doesn\'t support IndexedDB');
            return;
        }

        var connection = indexedDB.open('hltv-monkey', 1);

        connection.onupgradeneeded = function () {
            var db = this.result;
            if (!db.objectStoreNames.contains('notes')) {
                db.createObjectStore('notes', { keyPath: 'id' });
            }
        }

        connection.onsuccess = function () {
            var db = this.result;
            vetoBox.append('<div id="notepad-wrapper" class="padding"><div>Notes</div><textarea id="notepad"></textarea></div>')
            $("#notepad-wrapper").css(STYLES.NOTEPAD_WRAPPER);
            $("#notepad").css(STYLES.NOTEPAD);

            var id = getMatchId();
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

    addStatsButton();
    addOnlineStatsButton();
    addLanStatsButton();
    addCopyButton();
    addMatchesLinks();
    addNotepad();
})();
