import HLTVMonkey from "../shared/services/HLTVMonkey"
import $ from 'jquery'
import teamPageParser from '../shared/utils/teamPageParser'

export default class OpponentRankVisualizer {
  constructor($table, map, teamNum) {
    this.map = map
    this.teamNum = teamNum
    const tableRows = Array.from($table.find("tbody tr"))
    this.matches = tableRows.map(tr => {
      let $tr = $(tr)
      let splittedDate = $tr.find("td:nth-of-type(1)").text().split("/")
      return {
        date: new Date(parseInt('20' + splittedDate[2], 10), parseInt(splittedDate[1], 10) - 1, parseInt(splittedDate[0], 10)),
        opponentUrl: $tr.find("td:nth-of-type(2) a")[0].href.replace('stats/teams', 'team'),
        won: $tr.find("td:nth-of-type(3)").hasClass("match-won")
      }
    })
    let id = `monkey_collect_opponent_ranks_${map}_team${teamNum}`
    $(`<div style="margin: 25px auto;text-align: center;"><button id='${id}' type='button'>Visualize opponent ranks</button></div>`).insertBefore($table)
    const $btn = $(`#${id}`)
    this.$parent = $btn.parent()
    $btn.click(() => {
      this.startCrawling()
      $btn.remove()
    })
  }

  async startCrawling () {
    this.progress(0)
    for (let i = 0; i < this.matches.length; i++) {
      let opponentPage = await HLTVMonkey.crawler.queue(this.matches[i].opponentUrl)
      this.matches[i].teamPage = teamPageParser(opponentPage)
      this.progress(i+1)
    }
    this.showChart()
  }

  progress(numDone) {
    this.$parent.text(`${numDone}/${this.matches.length}`)
  }

  showChart() {
    const id = `monkey_collect_opponent_ranks_${this.map}_team${this.teamNum}`
    this.$parent.html(`<div id="${id}"></div>`)
    this.matches.sort(function(a,b){
      return a.date - b.date
    });

    const matchesWithRankedOpponent = this.matches.filter(m => m.rank !== null)
    let chartObj = null;

    const selectId = `monkey_collect_opponent_ranks_select_${this.map}_team${this.teamNum}`
    this.$parent.append(`<select id="${selectId}"><option value="msline">Line</option><option value="MSArea">Area</option><option value="msspline">Spline</option><option value="mssplinearea">Spline area</option></select>`)
    $(`#${selectId}`).change(function() {
      console.log($(this).val())
      chartObj.chartType($(this).val())
    })

    FusionCharts.ready(() => {
			chartObj = new FusionCharts({
        type: 'msline',
        width: "100%",
        dataFormat: "json",
        renderAt: id,
        containerBackgroundOpacity: 0,
        heightOverride: false,
        dataSource: {
            chart: {
                "theme": "fint",
                "lineThickness": "2",
                "connectNullData": "1",
                bgAlpha: 100,
                showBorder: 0
            },
            "categories": [
              {
                  "category": matchesWithRankedOpponent.map(m => { return { label: `${m.date.getMonth()+1}/${m.date.getDate()}` } })
              }
          ],
          "dataset": [
              {
                  "seriesname": "Loss",
                  "color": "#e40a0a",
                  "data": matchesWithRankedOpponent.map(m => { return { value: m.won ? null : m.teamPage.rank, toolText: `Lost vs. ${m.teamPage.teamName} (#${m.teamPage.rank})` } })
              },
              {
                  "seriesname": "Win",
                  "color": "#08a500",
                  "data": matchesWithRankedOpponent.map(m => { return { value: m.won ? m.teamPage.rank : null, toolText: `Won vs. ${m.teamPage.teamName} (#${m.teamPage.rank})` } })
              }
            ]
        }
    });
    chartObj.render();
		});
  }
}