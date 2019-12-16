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
    HLTVMonkey.vetoBox.append("<button id='overunder'>overunder</button>");
    HLTVMonkey.vetoBox.append("<button id='weighted_rank'>weighted_rank</button>");
    HLTVMonkey.vetoBox.append("<button id='datacollectall'>datacollect_all</button>");
    $("#datacollect").click(() => { this.collect() });
    $("#overunder").click(() => { this.overUnder() });
    $("#weighted_rank").click(() => { this.copyWeightedRank() });
    $("#datacollectall").click(() => { this.collectAll() });
  }

  async collect () {
    await this.collectLastLan({ teamNum: 1 })
    await this.collectLastLan({ teamNum: 2 })
    this.findMapResults();
    this.copyData()
    console.log("collection done")
    $("#datacollect").text("done")
  }

  async collectAll () {
    await this.collectLastLan({ teamNum: 1 })
    await this.collectLastLan({ teamNum: 2 })
    this.findMapResults();
    this.copyDataAll()
    $("#c").text("done")
  }

  async overUnder () {
    this.findMapResults();
    const fields = DataCollectorService.fields
    const playedMaps = $("div.mapholder div.played")
    let arr = []
    playedMaps.each((index, playedMap) => {
      const map = $(playedMap).find("div.mapname").text()
      const resultSpans = $(playedMap).siblings("div.results").find("span")
      if (resultSpans.length === 0) return
      const team1Result = parseInt(resultSpans[0].innerText)
      const team2Result = parseInt(resultSpans[2].innerText)
      if (fields.team1.mapStats[map].tRoundsWin !== null && fields.team1.mapStats[map].ctRoundsWin !== null && fields.team2.mapStats[map].tRoundsWin !== null && fields.team2.mapStats[map].ctRoundsWin !== null) {
        arr.push(`${fields.team1.name}\t${fields.team2.name}\t${map}\t${fields.team1.mapStats[map].tRoundsWin}\t${fields.team1.mapStats[map].ctRoundsWin}\t${fields.team2.mapStats[map].tRoundsWin}\t${fields.team2.mapStats[map].ctRoundsWin}\t${team1Result}\t${team2Result}`)
      }
    })
    if (arr.length > 0) {
      let txtArea = $("<textarea></textarea>");
      txtArea.text(arr.join('\n'));
      $("body").append(txtArea);
      txtArea.select();
      document.execCommand('copy');
      txtArea.remove();
      $("#overunder").text("done")
    } else {
      $("#overunder").text("noinfo")
    }
  }

  async copyWeightedRank () {
    this.findMapResults();
    const fields = DataCollectorService.fields
    const playedMaps = $("div.mapholder div.played")
    let arr = []
    playedMaps.each((index, playedMap) => {
      const map = $(playedMap).find("div.mapname").text()
      const resultSpans = $(playedMap).siblings("div.results").find("span")
      if (resultSpans.length === 0) return
      const team1Result = parseInt(resultSpans[0].innerText)
      const team2Result = parseInt(resultSpans[2].innerText)
      if (fields.team1.mapStats[map].tRoundsWin !== null && fields.team1.mapStats[map].ctRoundsWin !== null && fields.team2.mapStats[map].tRoundsWin !== null && fields.team2.mapStats[map].ctRoundsWin !== null) {
        arr.push(`${fields.team1.name}\t${fields.team2.name}\t${map}\t${fields.team1.mapStats[map].aer}\t${fields.team1.mapStats[map].atr}\t${fields.team2.mapStats[map].aer}\t${fields.team2.mapStats[map].atr}\t${team1Result}\t${team2Result}`)
      }
    })
    if (arr.length > 0) {
      let txtArea = $("<textarea></textarea>");
      txtArea.text(arr.join('\n'));
      $("body").append(txtArea);
      txtArea.select();
      document.execCommand('copy');
      txtArea.remove();
      $("#weighted_rank").text("done")
    } else {
      $("#weighted_rank").text("noinfo")
    }
  }
  
  async collectLastLan ({ teamNum }) {
    const url = MatchDataService.getLineupMatchesUrl(teamNum === 1 ? MatchDataService.getPlayersTeam1(): MatchDataService.getPlayersTeam2(), { matchType: 'Lan'});
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
      if (resultSpans.length === 0) return
      const team1Result = resultSpans[0].innerText
      const team2Result = resultSpans[2].innerText
      DataCollectorService.fields.team1.mapStats[map].score = parseInt(team1Result)
      DataCollectorService.fields.team2.mapStats[map].score = parseInt(team2Result)
    })
  }

  copyData () {
    let txtArea = $("<textarea></textarea>");
    const fields = DataCollectorService.fields
    const domestic = DataCollectorService.isDomestic() ? "Yes" : "No"
    const onlineOrLan = DataCollectorService.isOnline() ? "Online" : "LAN"
    const knockout = this.isKnockout() ? "Yes" : "No"
    const lanFirst = this.isOpeningMatch() ? "Yes" : "No"
    const isNotContinent = fields.country !== "Europe" && fields.country !== "Asia" && fields.country !== "CIS" && fields.country !== "Oceania"
    const sheetJSON = {
      team1Name: fields.team1.name,
      team1Rank: fields.team1.rank,
      team1LastLan: Math.round(fields.team1.lastLan),
      team1Home: (isNotContinent && fields.team1.country === fields.country) ? "Yes" : "No",
      team2Name: fields.team2.name,
      team2Rank: fields.team2.rank,
      team2LastLan: Math.round(fields.team2.lastLan),
      team2Home: (isNotContinent && fields.team2.country === fields.country) ? "Yes" : "No",
      domestic,
      onlineOrLan,
      knockout,
      lanFirst,
      mapStats: {
        team1: fields.team1.mapStats,
        team2: fields.team2.mapStats
      }
    }
    txtArea.text(JSON.stringify(sheetJSON));
    $("body").append(txtArea);
    txtArea.select();
    document.execCommand('copy');
    txtArea.remove();
  }

  copyDataAll () {
    const fields = DataCollectorService.fields
    const domestic = DataCollectorService.isDomestic()
    const online = DataCollectorService.isOnline()
    const knockout = this.isKnockout()
    const lanFirst = this.isOpeningMatch()
    const isNotContinent = fields.country !== "Europe" && fields.country !== "Asia" && fields.country !== "CIS" && fields.country !== "Oceania"
    const team1Home = isNotContinent && fields.team1.country === fields.country
    const team2Home = isNotContinent && fields.team2.country === fields.country
    const team1Class = fields.team1.rank < 15 ? 1 : fields.team1.rank < 20 ? 2 : fields.team1.rank < 30 ? 3 : fields.team1.rank < 50 ? 4 : fields.team1.rank < 70 ? 5 : fields.team1.rank < 90 ? 6 : 7
    const team2Class = fields.team1.rank < 15 ? 1 : fields.team1.rank < 20 ? 2 : fields.team1.rank < 30 ? 3 : fields.team1.rank < 50 ? 4 : fields.team1.rank < 70 ? 5 : fields.team1.rank < 90 ? 6 : 7
    this.findMapResults();
    const playedMaps = $("div.mapholder div.played")
    let arr = []
    const team1Modifiers = {
      baseMotivation: online ? Math.max(0.5, Math.log2(fields.team1.rank)/Math.log2(200)) : 0.75,
      lastLan: online && fields.team1.lastLan <= 5 ? -0.5 : 0,
      classMotiv: team2Class < team1Class ? 0.1 : 0,
      domesticMotiv: domestic ? 0.2 : 0,
      knockoutMotiv: knockout && !online ? 0.25 : knockout && online ? 0.1 : 0,
      lanFirstMatch: fields.team1.rank < fields.team2.rank && lanFirst ? -0.3 : 0,
      onlineMotiv: online && team1Class < team2Class ? -0.1 : 0,
      homeMotiv: !online && team1Home ? 0.2 : 0
    }

    const team2Modifiers = {
      baseMotivation: online ? Math.max(0.5, Math.log2(fields.team2.rank)/Math.log2(200)) : 0.75,
      lastLan: online && fields.team2.lastLan <= 5 ? -0.5 : 0,
      classMotiv: team1Class < team2Class ? 0.1 : 0,
      domesticMotiv: domestic ? 0.2 : 0,
      knockoutMotiv: knockout && !online ? 0.25 : knockout && online ? 0.1 : 0,
      lanFirstMatch: fields.team2.rank < fields.team1.rank && lanFirst ? -0.3 : 0,
      onlineMotiv: online && team2Class < team1Class ? -0.1 : 0,
      homeMotiv: !online && team2Home ? 0.2 : 0
    }

    const team1Motivation = team1Modifiers.baseMotivation + team1Modifiers.lastLan + team1Modifiers.classMotiv + team1Modifiers.domesticMotiv
      + team1Modifiers.knockoutMotiv + team1Modifiers.lanFirstMatch + team1Modifiers.onlineMotiv + team1Modifiers.homeMotiv;
    const team2Motivation = team2Modifiers.baseMotivation + team2Modifiers.lastLan + team2Modifiers.classMotiv + team2Modifiers.domesticMotiv
      + team2Modifiers.knockoutMotiv + team2Modifiers.lanFirstMatch + team2Modifiers.onlineMotiv + team2Modifiers.homeMotiv

    playedMaps.each((index, playedMap) => {
      const map = $(playedMap).find("div.mapname").text()
      const resultSpans = $(playedMap).siblings("div.results").find("span")
      if (resultSpans.length === 0) return
      const team1Result = parseInt(resultSpans[0].innerText)
      const team2Result = parseInt(resultSpans[2].innerText)
      if (fields.team1.mapStats[map].tRoundsWin !== null && fields.team1.mapStats[map].ctRoundsWin !== null && fields.team2.mapStats[map].tRoundsWin !== null && fields.team2.mapStats[map].ctRoundsWin !== null) {
        arr.push(`${fields.team1.name}\t${fields.team2.name}\t${map}\t${fields.team1.mapStats[map].aer}\t${fields.team1.mapStats[map].atr}\t${fields.team1.mapStats[map].tRoundsWin}\t${fields.team1.mapStats[map].ctRoundsWin}\t${team1Motivation}\t${fields.team2.mapStats[map].aer}\t${fields.team2.mapStats[map].atr}\t${fields.team2.mapStats[map].tRoundsWin}\t${fields.team2.mapStats[map].ctRoundsWin}\t${team2Motivation}\t${team1Result}\t${team2Result}`)
      }
    })
    if (arr.length > 0) {
      let txtArea = $("<textarea></textarea>");
      txtArea.text(arr.join('\n'));
      $("body").append(txtArea);
      txtArea.select();
      document.execCommand('copy');
      txtArea.remove();
      $("#datacollectall").text("done")
    } else {
      $("#datacollectall").text("noinfo")
    }
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
