class OverUnderService {
  constructor() {
    this.stats = {}
    this.callbacks = []
  }

  add ({ map, teamNum, timesPlayed, roundWinAfterFirstKill, roundWinAfterFirstDeath }) {
    this.stats[map] = this.stats[map] || {}
    this.stats[map][`team${teamNum}`] = {
      roundWinAfterFirstKill,
      roundWinAfterFirstDeath,
      timesPlayed
    }
    if (this.stats[map].team1 && this.stats[map].team2) {
      this.notify(map, this.stats[map])
    }
  }

  subscribe (fn) {
    this.callbacks.push(fn)
  }

  notify(map, stats) {
    this.callbacks.forEach(fn => fn(map, stats))
  }
}

export default new OverUnderService()
