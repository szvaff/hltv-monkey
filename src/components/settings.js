import $ from 'jquery'
import SettingsService from '../shared/services/SettingsService';
import HLTVMonkey from '../shared/services/HLTVMonkey';
import { LOCALSTORAGE_KEYS } from '../shared/constants';

export class Settings {
  constructor() {
    HLTVMonkey.vetoBox.append("<div><input type='checkbox' id='exclude_matchday' /><label for='exclude_matchday'>Exclude matchday</label></div>");
    HLTVMonkey.vetoBox.append("<div>Load stats from: <select id='month_select'>" + this.createMonthOptionElements() + "</select><a id='save_month_selection'>Save selection</a></div>");
    HLTVMonkey.vetoBox.append("<div>Min. players: <select id='min_lineup_select'>" + this.createPlayerOptionElements() + "</select><a id='save_lineup_selection'>Save selection</a></div>");

    $("#exclude_matchday").change(function() {
      var val = $(this).is(":checked");
      val ? SettingsService.minusDays = 1 : SettingsService.minusDays = 0;
    });

    $("#month_select").change(function() {
      SettingsService.days = parseInt($(this).val());
    });

    $("#min_lineup_select").change(function() {
      SettingsService.minLineupMatch = parseInt($(this).val());
    });

    $("#save_month_selection").click(() => {
      localStorage.setItem(LOCALSTORAGE_KEYS.MONTH, SettingsService.days);
    });

    $("#save_lineup_selection").click(() => {
      localStorage.setItem(LOCALSTORAGE_KEYS.MIN_LINEUP_MATCH, SettingsService.minLineupMatch);
    });
  }

  createOptionElement(value, txt, test) {
    return '<option ' + (value === test ? 'selected' : '') + ' value="' + value + '">' + txt + '</option>';
  }

  createMonthOptionElements() {
    return this.createOptionElement(90, "Last 3 months", SettingsService.days) + this.createOptionElement(60, "Last 2 months", SettingsService.days) + this.createOptionElement(30, "Last month", SettingsService.days);
  }

  createPlayerOptionElements() {
    return this.createOptionElement(1, 1, SettingsService.minLineupMatch) + this.createOptionElement(2, 2, SettingsService.minLineupMatch) + this.createOptionElement(3, 3, SettingsService.minLineupMatch) + this.createOptionElement(4, 4, SettingsService.minLineupMatch) + this.createOptionElement(5, 5, SettingsService.minLineupMatch);
  }
}