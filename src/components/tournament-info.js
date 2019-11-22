import $ from 'jquery'
import IndexedDbService from '../shared/services/IndexedDbService';
import HLTVMonkey from '../shared/services/HLTVMonkey';
import DataCollectorService from '../shared/services/DataCollectorService';

export class TournamentInfo {
  constructor () {
    this.url = $("div.teamsBox div.timeAndEvent a").attr('href')
    this.init();
  }

  async init() {
    $("<div id='monkey_tournament_info' style='text-align:center;'></div>").insertAfter("div.teamsBox")
    this.$infoDiv = $("#monkey_tournament_info");
    try {
      const fromDb = await IndexedDbService.getFromStoreById('tournament', this.url)
      this.displayInfo(fromDb.info)
    } catch (e) {
      this.addLoadButton();
    }
  }

  addLoadButton() {
    this.$infoDiv.append("<a id='monkey_load_tournament_info' href='#'>Load tournament info</a>")
    $("#monkey_load_tournament_info").click(async () => {
      this.$infoDiv.html("Please wait")
      const tournamentPage = await HLTVMonkey.crawler.queue(`https://www.hltv.org/${this.url}`)
      let dummyDocument = $('<div></div>');
      dummyDocument.html(tournamentPage);
      let info = dummyDocument.find(".event-header-component.standard-box")
      this.displayInfo(info)
      IndexedDbService.put('tournament', { id: this.url, info: info[0].outerHTML })
    })
  }

  displayInfo(info) {
    this.$infoDiv.css("text-align", "left")
    this.$infoDiv.css("margin-top", "10px")
    $(info).find("tbody").css("font-weight", "500")
    $(info).find("th.headline").removeClass("headline")
    this.$infoDiv.html(info)
    DataCollectorService.addData({ field: "location", value: this.$infoDiv.find("td.location").text().trim() })
  }
}