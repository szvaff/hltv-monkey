import { unixDate, team1, team2 } from "../shared/constants";
import $ from 'jquery'
import MatchDataService from "../shared/services/MatchDataService";
import HLTVMonkey from "../shared/services/HLTVMonkey";

export class MatchCopyHandler {
  constructor () {
    this.addCopyButton()
  }

  addCopyButton() {
    HLTVMonkey.vetoBox.append("<button id='copybtn'>copy</button>");
    $("#copybtn").click(this.onCopyClick);
  }

  onCopyClick() {
    var dateString = unixDate.getFullYear() + "/" + ((unixDate.getMonth()+1) < 10 ? "0" : "") + (unixDate.getMonth()+1) + "/" + unixDate.getDate() + " " + unixDate.getHours() + ":" + (unixDate.getMinutes() < 10 ? "0" : "") + unixDate.getMinutes();
    var event = $("div.event").text();

    var format = "BO3";
    if (HLTVMonkey.vetoBox.text().indexOf("Best of 1") > 0) {
      if (MatchDataService.isTba()) {
        format = "BO1";
      } else {
        format = MatchDataService.getMaps()[0];
      }
    }

    if (HLTVMonkey.vetoBox.text().indexOf("Best of 2") > 0) {
      format = "BO2";
    }

    var teams = team1 + " vs " + team2;
    var txtArea = $("<textarea></textarea>");
    txtArea.text(dateString + "\t" + event + "\t" + teams + "\t" + format);
    $("body").append(txtArea);
    txtArea.select();
    document.execCommand('copy');
    txtArea.remove();
  }

}