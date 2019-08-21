import { LOCALSTORAGE_KEYS } from "../constants";

class SettingsService {
  constructor() {
    this.minLineupMatch = parseInt(localStorage.getItem(LOCALSTORAGE_KEYS.MIN_LINEUP_MATCH)) || 4;
    this.matchType = null;
    this.days = parseInt(localStorage.getItem(LOCALSTORAGE_KEYS.MONTH)) || 90;
    this.minusDays = 0;
  }
}

export default new SettingsService()