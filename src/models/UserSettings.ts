export interface UserSettings {
  userId: string;
  defaultTimerMinutes: number;
  completionSoundEnabled: boolean;
  completionSoundVolume: number;
  pauseAlertMinutes: number;
  dailyGoalMinutes: number;
  autoStartTimer: boolean;
  reduceAnimations: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSettingsDatabaseRow {
  user_id: string;
  default_timer_minutes: number;
  completion_sound_enabled: number | boolean;
  completion_sound_volume: number;
  pause_alert_minutes: number;
  daily_goal_minutes: number;
  auto_start_timer: number | boolean;
  reduce_animations: number | boolean;
  created_at: Date;
  updated_at: Date;
}

export const defaultUserSettings = {
  defaultTimerMinutes: 25,
  completionSoundEnabled: true,
  completionSoundVolume: 75,
  pauseAlertMinutes: 5,
  dailyGoalMinutes: 60,
  autoStartTimer: false,
  reduceAnimations: false
};

export function mapUserSettingsFromDatabase(
  row: UserSettingsDatabaseRow
): UserSettings {
  return {
    userId: row.user_id,
    defaultTimerMinutes: row.default_timer_minutes,
    completionSoundEnabled: Boolean(row.completion_sound_enabled),
    completionSoundVolume: row.completion_sound_volume,
    pauseAlertMinutes: row.pause_alert_minutes,
    dailyGoalMinutes: row.daily_goal_minutes,
    autoStartTimer: Boolean(row.auto_start_timer),
    reduceAnimations: Boolean(row.reduce_animations),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
