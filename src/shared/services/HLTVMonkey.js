import $ from 'jquery'
import { Crawler } from "../utils/crawler";
// import '../../vendor/fusioncharts'
// import '../../vendor/fusioncharts.charts'
// import '../../vendor/fusioncharts.theme.fint'

class HLTVMonkey {
  constructor() {
    this.crawler = new Crawler()
  }

  init() {
    return new Promise(resolve => {
      $(document).ready(() => {
        this.headLineBoxes = $(".lineup .box-headline");
        this.vetoBox = $("div.veto-box:first");

        if (this.vetoBox.length === 0) {
          $('<div class="standard-box veto-box"></div>').insertBefore($("div.mapholder").parent());
          this.vetoBox = $("div.veto-box:first");
        }
  
        resolve();
      })
    });
  }
}

export default new HLTVMonkey()