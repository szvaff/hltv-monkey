// ==UserScript==
// @name         HLTV Monkey
// @namespace    https://www.hltv.org/matches/*
// @version      0.1
// @description  Script to load team statistics in one click and more
// @author       sZVAFF
// @match        https://www.hltv.org/matches/*
// @require http://code.jquery.com/jquery-latest.js
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
        }
    };
    
    var STATS_DIV = "<div style='display: inline-block; max-width: 45%; padding:5px;'></div>";
    var MIN_LINEUP_MATCH = 4;
    var MATCH_TYPE;
    var DAYS = 90;
    var URL_PREFIX_LINEUP_STATS = "https://www.hltv.org/stats/lineup/map/";
    
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
    
    $("div.mapholder div.mapname").each(function(index, el) {
        if (el.innerText !== "TBA") {
            maps.push(el.innerText);
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
            clean();
            MATCH_TYPE = null;
            queryStats();
        });
    }
    
    function addOnlineStatsButton() {
        vetoBox.append("<button id='onlinestatsbtn'>Stats [Online]</button>");
        
        $("#onlinestatsbtn").click(function() {
            clean();
            MATCH_TYPE = "Online";
            queryStats();
        });
    }

    function addLanStatsButton() {
        vetoBox.append("<button id='lanstatsbtn'>Stats [LAN]</button>");
        
        $("#lanstatsbtn").click(function() {
            clean();
            MATCH_TYPE = "Lan";
            queryStats();
        });
    }
    
    function getLineupStatsUrlForMap(playersTeam, map) {
        var baseUrl = URL_PREFIX_LINEUP_STATS + MAP_ID[map] + "?";
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
                if (maps[0] && maps[0] !== "TBA") {
                    format = maps[0];
                } else {
                    format = "BO1";
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
            maps = ["Cache", "Cobblestone", "Inferno", "Mirage", "Nuke", "Overpass", "Train"];
        }
        
        var urlPromises1 = [];
        var urlPromises2 = [];
        var urls1 = [];
        var urls2 = [];
        for (var i = 0; i < maps.length; i++) {
            var map = maps[i];
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

    function appendStats(result, urls, statsDiv) {
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
                var toAppend = $("<div style='margin-top:10px'></div>").append(parent).append(stats).append(graph).append(next);
                var afterFirstKill = parseFloat(toAppend.find(".large-strong:first").text());
                var afterFirstDeath = parseFloat(toAppend.find(".large-strong:nth(1)").text());
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
    }
    
    addStatsButton();
    addOnlineStatsButton();
    addLanStatsButton();
    addCopyButton();
})();