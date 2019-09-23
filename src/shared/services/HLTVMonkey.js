import $ from 'jquery'
import { Crawler } from "../utils/crawler";
import { MatchCopyHandler } from '@/components/copy-handler';
import { MatchesLinks } from '@/components/matches-links';
import { Notepad } from '@/components/notepad';
import { Settings } from '@/components/settings';
import { Stats } from '@/components/stats';
import { TournamentInfo } from '../../components/tournament-info';
// import '../../vendor/fusioncharts'
// import '../../vendor/fusioncharts.charts'
// import '../../vendor/fusioncharts.theme.fint'

class HLTVMonkey {
  constructor() {
    this.crawler = new Crawler()
  }

  init() {
    $(document).ready(() => {
      this.headLineBoxes = $(".lineup .box-headline");
      this.vetoBox = $("div.veto-box:first");

      if (this.vetoBox.length === 0) {
        $('<div class="standard-box veto-box"></div>').insertBefore($("div.mapholder").parent());
        this.vetoBox = $("div.veto-box:first");
      }

      new MatchesLinks()
      new Settings()
      new Stats()
      new MatchCopyHandler()
      new Notepad()
      new TournamentInfo()
    })
  }
}

export default new HLTVMonkey()