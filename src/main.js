import '@/styles/index.scss';
import $ from 'jquery'
import { MatchCopyHandler } from './components/copy-handler';
import { MatchesLinks } from './components/matches-links';
import { Notepad } from './components/notepad';
import { Settings } from './components/settings';
import HLTVMonkey from './shared/services/HLTVMonkey';
import { Stats } from './components/stats';


$(document).ready(() => {
  HLTVMonkey.init().then(() => {
    new MatchesLinks()
    new Settings()
    new Stats()
    new MatchCopyHandler()
    new Notepad()
  })
})