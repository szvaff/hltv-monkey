// ==UserScript==
// @name         HLTV Monkey
// @namespace    https://www.hltv.org/matches/*
// @version      1.0.0
// @description  Script to load team statistics in one click and more
// @author       sZVAFF
// @match        https://www.hltv.org/matches/*
// @require      http://code.jquery.com/jquery-latest.js
// @connect      35.189.241.231
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    
    var MAP_ID = {
        Cache: 29,
        Cobblestone: 39,
        Inferno: 33,
        Mirage: 32,
        Nuke: 34,
        Overpass: 40,
        Train: 35
    };

    var ALL_MAPS = ["Cache", "Cobblestone", "Inferno", "Mirage", "Nuke", "Overpass", "Train"];
    
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
        }
    };
    
    var STATS_DIV = "<div style='display: inline-block; max-width: 45%; padding:5px; position: relative;'></div>";
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
    var dateFilter = getDateFilter();
    var maps = [];
    var selectedMap = null;
    var tba = false;
    
    $("div.mapholder div.mapname").each(function(index, el) {
        if (el.innerText !== "TBA") {
            maps.push(el.innerText);
        } else {
            tba = true;
        }
    });
    
    function getDateFilter() {
        var now = new Date();
        now.setDate(now.getDate());
        var date = new Date();
        date.setDate(date.getDate() - DAYS);
        return "startDate=" + (date.getFullYear()) + "-" + (date.getMonth()+1 < 10 ? "0" :"") + (date.getMonth()+1) + "-" + (date.getDate() < 10 ? "0" :"") + date.getDate() + "&endDate=" + now.getFullYear() + "-" + (now.getMonth()+1 < 10 ? "0" :"") + (now.getMonth()+1) + "-" + (now.getDate() < 10 ? "0" :"") + now.getDate();
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
        vetoBox.append("<button id='statsbtn'>Stats</button>");
        
        $("#statsbtn").click(function() {
            startStatsQuery();
        });
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

        return baseUrl + "minLineupMatch=" + MIN_LINEUP_MATCH + "&" + dateFilter + ( MATCH_TYPE == null ? "" : "&matchType=" + MATCH_TYPE);
    }

    function getLineupMatchesUrl(playersTeam) {
        var baseUrl = URL_PREFIX_LINEUP_MATCHES + "?";
        for (var i = 0; i < 5; i++) {
            var href1 = playersTeam[i].href.substring(playersTeam[i].href.indexOf("/player/") + "/player/".length, playersTeam[i].href.lastIndexOf("/"));
            baseUrl += "lineup=" + href1 + "&";
        }

        return baseUrl + "minLineupMatch=" + MIN_LINEUP_MATCH + "&" + dateFilter + ( MATCH_TYPE == null ? "" : "&matchType=" + MATCH_TYPE);
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
            appendStats(result, urls1, $statsDiv1);
        });
        
        Promise.all(urlPromises2).then(function(result) {
            appendStats(result, urls2, $statsDiv2);
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
        $(".mapstat." + which).css("height", "100%");

        $(".mapstat-changer").css(STYLES.INACTIVE_MAP_CHANGER_ITEM);
        $(".mapstat-changer." + which).css(STYLES.ACTIVE_MAP_CHANGER_ITEM);
    }

    function appendStats(result, urls, statsDiv) {
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
                    results.find("tr td:nth-child(2)").remove();
                    results.find("tr td:nth-child(3)").remove();
                } else {
                    results.find("tr td:nth-child(3)").remove();
                }

                results.css(STYLES.RESULTS);
                results.find("tr td:nth-child(3)").css(STYLES.RESULTS_RESULT_TD);

                var ranksGraphsBtn = $("<div style='text-align: center; margin-top: 25px;'><button type='button'>Draw Wins/Losses Graph</button></div>");
                ranksGraphsBtn.on("click", drawRankGraphs);
                
                var toAppend = $("<div class='mapstat " + themap + "' style='margin-top:10px'></div>").append(parent).append(stats).append(graph).append(next).append(results);
                toAppend.append(ranksGraphsBtn);

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
    
    function drawRankGraphs() {
        var matchRows = $(this).siblings("table.stats-table").find("tbody tr");
        var matches = [];
        var request = [];
        var me = $(this);

        for (var i = 0; i < matchRows.length; i++) {
            var date = $(matchRows[i]).find("td.time a").text();
            var dateSplitted = date.split("/");
            var name = $(matchRows[i]).find("a.image-and-label span").text();
            var won = $($(matchRows[i]).find(".statsTeamMapResult")).hasClass("match-won");
            matches.push({name: name, won: won, date: date});
            var month = parseInt(dateSplitted[1]) - 1;
            var year = parseInt("20" + dateSplitted[2]);
            var day = parseInt(dateSplitted[0]);

            if (year < 2017 || (year == 2017 && month < 11) || (year == 2017 && month == 11 && day < 16)) {
                year = 2017, month = 11, day = 16;
            }

            month = month > 9 ? month : "0" + month;
            day = day > 9 ? day : "0" + day;
            request.push({
                date: year + "-" + month + "-" + day + "T23:59Z",
                name: name
            });
        }

        console.log("GM_xmlhttpRequest");
        GM_xmlhttpRequest({
            method: "POST",
            url: "http://35.189.241.231/find",
            data: JSON.stringify(request),
            headers: {
                "Content-Type": "application/json"
            },
            onload: function(response) {
                var rankArrays = JSON.parse(response.responseText);
                var data = [];

                for (var i = 0; i < rankArrays.length; i++) {
                    data.push(rankArrays[i][rankArrays[i].length - 1])
                }

                createRankGraph(me, data, matches);
            }
        });

    }

    function findRank(data, teamName) {
        for (var i = 0; i < data.length; i++) {
            if (!data[i]) {
                continue;
            }
            
            if (data[i].name === teamName) {
                return data[i].rank;
            }
        }

        return null;
    }

    function createRankGraph(btn, data, matches) {
        var parent = btn.parent();
        btn.remove();

        var nowEpoch = new Date().getTime();

        var container = $("<div style='position:absolute;bottom:0;width:100%'></div>");
        var wins = $("<div id='rank-wins" + nowEpoch + "' style='margin-top: 25px;'>wins</div>");
        var losses = $("<div id='rank-losses" + nowEpoch + "'style='margin-top: 25px;'>losses</div>");
        container.append(wins, losses);

        var winData = [];
        var lossData = [];
        var winSum = 0, winCount = 0;
        var lossSum = 0, lossCount = 0;

        for (var i = 0; i < matches.length; i++) {
            var match = matches[i];
            var rank = findRank(data, match.name);

            if (rank == null || rank == "" || rank == undefined) {
                console.log("Can't find rank for: " + match.name);
                continue;
            }

            rank = parseInt(rank);
            
            if (match.won) {
                winData.push({
                    label: match.date,
                    value: rank,
                    toolText: match.name
                });

                winSum += rank;
                winCount++;
            } else {
                lossData.push({
                    label: match.date,
                    value: rank,
                    toolText: match.name
                });

                lossSum += rank;
                lossCount++;
            }
        }

        parent.append(container);
        $("<div style='height: 650px'></div>").insertBefore(container);
        
        FusionCharts.ready(function () {
            new FusionCharts({
                width: "100%",
                dataFormat: "json",
                type: "line",
                renderAt: "rank-wins" + nowEpoch,
                containerBackgroundOpacity: 0,
                heightOverride: false,
                dataSource:{  
                    chart:{  
                        bgcolor: "#ffffff",
                        bgAlpha: 100,
                        caption: "Wins",
                        lineThickness : "2",
                        paletteColors : "#1aaf5d",
                        baseFontColor : "#7d7d7d",
                        baseFont : "Helvetica Neue,Arial",
                        showBorder : "0",
                        canvasBorderAlpha : "0",
                        divlineAlpha : "100",
                        divlineColor : "#999999",
                        divlineThickness : "1",
                        divLineIsDashed : "1",
                        divLineDashLen: "1",
                        divLineGapLen : "1",
                        showXAxisLine : "1",
                        xAxisLineThickness : "1",
                        xAxisLineColor : "#999999",
                        showAlternateHGridColor : "0",
                    },
                    data: winData.reverse(),
                    trendlines: [{
                        line: [{
                            startvalue: winSum/winCount,
                            color: "#6baa01",
                            displayvalue: "Avg " + (winSum/winCount).toFixed(2),
                            valueOnRight: 1
                        }]
                    }]
                }
            }).render();
        });

        FusionCharts.ready(function () {
            new FusionCharts({
                width: "100%",
                dataFormat: "json",
                type: "line",
                renderAt: "rank-losses" + nowEpoch,
                containerBackgroundOpacity: 0,
                heightOverride: false,
                dataSource:{  
                    chart:{
                        bgcolor: "#ffffff",
                        bgAlpha: 100,
                        caption: "Losses",
                        lineThickness : "2",
                        paletteColors : "#DD2C00",
                        baseFontColor : "#7d7d7d",
                        baseFont : "Helvetica Neue,Arial",
                        showBorder : "0",
                        canvasBorderAlpha : "0",
                        divlineAlpha : "100",
                        divlineColor : "#999999",
                        divlineThickness : "1",
                        divLineIsDashed : "1",
                        divLineDashLen: "1",
                        divLineGapLen : "1",
                        showXAxisLine : "1",
                        xAxisLineThickness : "1",
                        xAxisLineColor : "#999999",
                        showAlternateHGridColor : "0",
                    },
                    data: lossData.reverse(),
                    trendlines: [{
                        line: [{
                            startvalue: lossSum/lossCount,
                            color: "#f0506e",
                            displayvalue: "Avg " + (lossSum/lossCount).toFixed(2),
                            valueOnRight: 1
                        }]
                    }]
                }
            }).render();
        });
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
    
    addStatsButton();
    addOnlineStatsButton();
    addLanStatsButton();
    addCopyButton();
    addMatchesLinks();
})();