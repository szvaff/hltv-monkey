import HLTVMonkey from "../shared/services/HLTVMonkey";
import MatchDataService from '../shared/services/MatchDataService';
import DataCollectorService from "../shared/services/DataCollectorService";
import $ from 'jquery'
import { unixDate } from "../shared/constants";

export class DataCollector {
  constructor () {
    this.add()
  }

  add() {
    HLTVMonkey.vetoBox.append("<button id='datacollect'>datacollect</button>");
    $("#datacollect").click(() => { this.collect() });
  }

  async collect () {
    await this.collectLastLan({ teamNum: 1 })
    await this.collectLastLan({ teamNum: 2 })
    this.findMapResults();
    this.copyData()
    console.log("collection done")
    $("#datacollect").text("done")
  }
  
  async collectLastLan ({ teamNum }) {
    const url = MatchDataService.getLineupMatchesUrl(teamNum === 1 ? MatchDataService.getPlayersTeam1(): MatchDataService.getPlayersTeam2(), { matchType: 'LAN'});
    const teamMatchesPage = await HLTVMonkey.crawler.queue(url)
    let dummyDocument = $('<div></div>');
    dummyDocument.html(teamMatchesPage);
    let tableRows = dummyDocument.find("table.stats-table tbody tr")
    if (tableRows.length === 0) {
      DataCollectorService.addTeamData({ teamNum, field: 'lastLan', value: 100})
    } else {
      let splittedDate = tableRows.find("td")[0].innerText.split("/")
      let date = new Date()
      date.setDate(splittedDate[0])
      date.setMonth(parseInt(splittedDate[1])-1)
      date.setFullYear(`20${splittedDate[2]}`)
      const now = new Date(unixDate)
      DataCollectorService.addTeamData({ teamNum, field: 'lastLan', value: ((now - date) / 1000 / 60 / 60 / 24)})
    }
  }

  findMapResults () {
    const playedMaps = $("div.mapholder div.played")
    playedMaps.each((index, playedMap) => {
      const map = $(playedMap).find("div.mapname").text()
      const resultSpans = $(playedMap).siblings("div.results").find("span")
      const team1Result = resultSpans[0].innerText
      const team2Result = resultSpans[2].innerText
      DataCollectorService.fields.team1.mapStats[map].score = team1Result
      DataCollectorService.fields.team2.mapStats[map].score = team2Result
    })
  }

  copyData () {
    let txtArea = $("<textarea></textarea>");
    const fields = DataCollectorService.fields
    const domestic = DataCollectorService.isDomestic() ? "Yes" : "No"
    const onlineOrLan = DataCollectorService.isOnline() ? "Online" : "LAN"
    const knockout = this.isKnockout() ? "Yes" : "No"
    const lanFirst = this.isOpeningMatch() ? "Yes" : "No"
    const sheetJSON = {
      team1Name: fields.team1.name,
      team1Rank: fields.team1.rank,
      team1LastLan: Math.round(fields.team1.lastLan),
      team2Name: fields.team2.name,
      team2Rank: fields.team2.rank,
      team2LastLan: Math.round(fields.team2.lastLan),
      domestic,
      onlineOrLan,
      knockout,
      lanFirst,
      mapStats: {
        team1: fields.team1.mapStats,
        team2: fields.team2.mapStats
      }
    }
    console.log(sheetJSON)
    txtArea.text(JSON.stringify(sheetJSON));
    $("body").append(txtArea);
    txtArea.select();
    document.execCommand('copy');
    txtArea.remove();
  }

  isOpeningMatch () {
    return DataCollectorService.fields.description.toLowerCase().indexOf('opening') > -1
  }

  isKnockout () {
    const desc = DataCollectorService.fields.description.toLowerCase();
    if (desc.indexOf('eliminated') > - 1) return true
    if (desc.indexOf('upper')) return false
    if (desc.indexOf('lower')) return true
    if (desc.indexOf('final') > -1) return true
  }
}
