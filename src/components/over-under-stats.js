import OverUnderService from "../shared/services/OverUnderService"
import $ from 'jquery'

export class OverUnderStats {
  constructor($root) {
    this.$root = $root
    OverUnderService.subscribe(this.update(this.$root))
  }

  update ($root) {
    return (map, stats) => {
      const wrapper = $('<div class="col standard-box big-padding"></div>')
      wrapper.append(`<div class="large-strong" style="font-size: 12px; font-weight: bold;">${map}</div>`)
      const notEnoughMatches = stats.team1.timesPlayed < 3 || stats.team2.timesPlayed < 3
      if (notEnoughMatches) {
        wrapper.append(`<div class="small-label-below">SKIP (not enough matches)</div>`)
      } else {
        console.log(map, stats)
        const num = Math.abs(stats.team1.roundWinAfterFirstKill + stats.team1.roundWinAfterFirstDeath - stats.team2.roundWinAfterFirstKill - stats.team2.roundWinAfterFirstDeath) * 1000
        let res = 'SKIP'
        switch (map) {
          case 'Dust2':
            res = num < 140 ? 'SKIP' : 'UNDER'
            break
          case 'Inferno':
            res = num < 3 ? 'OVER' : num < 139 ? 'SKIP' : 'UNDER'
            break
          case 'Mirage':
            res = num < 124 ? 'SKIP' : 'UNDER'
            break
          case 'Nuke':
            res = num < 25 ? 'OVER' : num < 115 ? 'SKIP' : 'UNDER'
            break
          case 'Overpass':
            res = num < 87 ? 'SKIP' : 'UNDER'
            break
          case 'Train':
            res = num < 17 ? 'OVER' : num < 161 ? 'SKIP' : 'UNDER'
            break
          case 'Vertigo':
            res = num < 30 ? 'OVER' : num < 109 ? 'SKIP' : 'UNDER'
            break
          default:
            break
        }
        wrapper.append(`<div class="small-label-below">${res} (${num.toFixed(0)})</div>`)
      }
      $root.append(wrapper)
    }
  }
}