import { team1, team2, team1Rank, team2Rank, team1Country, team2Country } from "../constants";

class DataCollectorService {
  constructor () {
    this.fields = {
      location: null,
      country: null,
      description: null,
      team1: {
        name: team1,
        rank: team1Rank,
        country: team1Country,
        mapStats: {
          Dust2: { aer: null, atr: null, numOfMatches: 0, score: null },
          Mirage: { aer: null, atr: null, numOfMatches: 0, score: null },
          Inferno: { aer: null, atr: null, numOfMatches: 0, score: null },
          Nuke: { aer: null, atr: null, numOfMatches: 0, score: null },
          Train: { aer: null, atr: null, numOfMatches: 0, score: null },
          Overpass: { aer: null, atr: null, numOfMatches: 0, score: null },
          Vertigo: { aer: null, atr: null, numOfMatches: 0, score: null }
        }
      },
      team2: {
        name: team2,
        rank: team2Rank,
        country: team2Country,
        mapStats: {
          Dust2: { aer: null, atr: null, numOfMatches: 0, score: null },
          Mirage: { aer: null, atr: null, numOfMatches: 0, score: null },
          Inferno: { aer: null, atr: null, numOfMatches: 0, score: null },
          Nuke: { aer: null, atr: null, numOfMatches: 0, score: null },
          Train: { aer: null, atr: null, numOfMatches: 0, score: null },
          Overpass: { aer: null, atr: null, numOfMatches: 0, score: null },
          Vertigo: { aer: null, atr: null, numOfMatches: 0, score: null }
        }
      }
    }
  }

  addData ({ field, value }) {
    this.fields[field] = value
  }

  addTeamMapData({ teamNum, map, avgRating, avgEnemyRank, numOfMatches }) {
    this.fields[`team${teamNum}`].mapStats[map] = {
      aer: avgEnemyRank,
      atr: avgRating,
      numOfMatches,
      score: this.fields[`team${teamNum}`].mapStats[map].score
    }
  }

  addTeamData({ teamNum, field, value }) {
    this.fields[`team${teamNum}`][field] = value
  }

  isDomestic() {
    return this.fields.team1.country === this.fields.team2.country
  }

  isOnline () {
    return this.fields.location.toLowerCase().indexOf('online') > -1
  }
}

export default new DataCollectorService()