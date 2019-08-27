import SettingsService from "../services/SettingsService";

export function equals(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export function getSettings() {
  return {
    minusDays: SettingsService.minusDays,
    minLineupMatch: SettingsService.minLineupMatch,
    days: SettingsService.days
  };
}