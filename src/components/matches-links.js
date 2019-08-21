import $ from 'jquery'
import MatchDataService from '../shared/services/MatchDataService';
import HLTVMonkey from '../shared/services/HLTVMonkey';

export class MatchesLinks {
  constructor() {
    var url1 = MatchDataService.getLineupMatchesUrl(MatchDataService.getPlayersTeam1());
    var link1 = $("<a target='_blank' href='" + url1 + "'>Matches... </a>");
    $(HLTVMonkey.headLineBoxes[0]).append(link1);

    var url2 = MatchDataService.getLineupMatchesUrl(MatchDataService.getPlayersTeam2());
    var link2 = $("<a target='_blank' href='" + url2 + "'>Matches... </a>");
    $(HLTVMonkey.headLineBoxes[1]).append(link2);
  }
}