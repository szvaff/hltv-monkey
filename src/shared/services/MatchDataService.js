import $ from 'jquery'
import { URL_PREFIX_LINEUP_MATCHES, unixDate, URL_PREFIX_LINEUP_STATS, MAP_ID } from '../constants';
import SettingsService from './SettingsService';

class MatchDataService {
  constructor() {
    this.tba = false
    this.maps = []
    this.matchId = null;

    $("div.mapholder div.mapname").each((index, el) => {
      if (el.innerText !== "TBA") {
          this.maps.push(el.innerText);
      } else {
          this.tba = true;
      }
    });

    var lineupsDivs = $("div.lineups div.lineup");
    if ($("[data-team1-players-data]").length > 0) {
      this.playersTeam1 = JSON.parse($("[data-team1-players-data]")[0].attributes["data-team1-players-data"].nodeValue)
      this.playersTeam2 = JSON.parse($("[data-team2-players-data]")[0].attributes["data-team2-players-data"].nodeValue)
    } else {
      this.playersTeam1 = $(lineupsDivs[0]).find(".players").find("td.player a");
      this.playersTeam2 = $(lineupsDivs[1]).find(".players").find("td.player a");
    }
  }

  getLineupStatsUrlForMap(playersTeam, map) {
    var baseUrl = URL_PREFIX_LINEUP_STATS + MAP_ID[map] + "?";
    
    if (playersTeam.length > 5) {
      for (var i = 0; i < 5; i++) {
        var href1 = playersTeam[i].href.substring(playersTeam[i].href.indexOf("/player/") + "/player/".length, playersTeam[i].href.lastIndexOf("/"));
        baseUrl += "lineup=" + href1 + "&";
      }
    } else {
      for (var item in playersTeam) {
        baseUrl += "lineup=" + item + "&";
      }
    }

    return baseUrl + "minLineupMatch=" + SettingsService.minLineupMatch + "&" + this.getDateFilter() + (SettingsService.matchType == null ? "" : "&matchType=" + SettingsService.matchType);
  }

  getLineupMatchesUrl(playersTeam) {
    var baseUrl = URL_PREFIX_LINEUP_MATCHES + "?";
    if (playersTeam.length > 5) {
      for (var i = 0; i < 5; i++) {
        var href1 = playersTeam[i].href.substring(playersTeam[i].href.indexOf("/player/") + "/player/".length, playersTeam[i].href.lastIndexOf("/"));
        baseUrl += "lineup=" + href1 + "&";
      }
    } else {
      for (var item in playersTeam) {
        baseUrl += "lineup=" + item + "&";
      }
    }

    return baseUrl + "minLineupMatch=" + SettingsService.minLineupMatch + "&" + this.getDateFilter() + ( SettingsService.matchType == null ? "" : "&matchType=" + SettingsService.matchType);
  }

  getDateFilter() {
    var to = new Date(unixDate.getTime());
    to.setDate(to.getDate() - SettingsService.minusDays);
    var from = new Date(unixDate.getTime());
    from.setDate(from.getDate() - SettingsService.days - SettingsService.minusDays);
    return "startDate=" + (from.getFullYear()) + "-" + (from.getMonth()+1 < 10 ? "0" :"") + (from.getMonth()+1) + "-" + (from.getDate() < 10 ? "0" :"") + from.getDate() + "&endDate=" + to.getFullYear() + "-" + (to.getMonth()+1 < 10 ? "0" :"") + (to.getMonth()+1) + "-" + (to.getDate() < 10 ? "0" :"") + to.getDate();
  }

  getMatchId() {
    if (this.matchId !== null) {
      return this.matchId;
    }

    this.matchId = window.location.href.replace("https://www.hltv.org/matches/", "").split("/")[0];
    return this.matchId;
  }

  isTba() {
    return this.tba
  }

  getMaps() {
    return this.maps
  }

  getPlayersTeam1() {
    return this.playersTeam1
  }

  getPlayersTeam2() {
    return this.playersTeam2
  }
}

export default new MatchDataService()