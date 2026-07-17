import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";

import { database } from "../config/database";
import { AppError } from "../errors/AppError";
import {
  defaultUserSettings,
  mapUserSettingsFromDatabase,
  UserSettings,
  UserSettingsDatabaseRow
} from "../models/UserSettings";

const settingsSelect = `SELECT user_id, default_timer_minutes, completion_sound_enabled,
  completion_sound_volume, pause_alert_minutes, daily_goal_minutes,
  auto_start_timer, reduce_animations, created_at, updated_at
  FROM user_settings
  WHERE user_id = ?
  LIMIT 1`;

function parseIntegerSetting(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number
) {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < minimum || parsedValue > maximum) {
    throw new AppError(`${label} deve estar entre ${minimum} e ${maximum}.`);
  }

  return parsedValue;
}

function parseBooleanSetting(value: unknown, label: string) {
  if (typeof value !== "boolean") {
    throw new AppError(`${label} deve ser verdadeiro ou falso.`);
  }

  return value;
}

export class SettingsController {
  private async getOrCreate(userId: string) {
    await database.execute<ResultSetHeader>(
      `INSERT INTO user_settings
        (user_id, default_timer_minutes, completion_sound_enabled,
         completion_sound_volume, pause_alert_minutes, daily_goal_minutes,
         auto_start_timer, reduce_animations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
      [
        userId,
        defaultUserSettings.defaultTimerMinutes,
        defaultUserSettings.completionSoundEnabled,
        defaultUserSettings.completionSoundVolume,
        defaultUserSettings.pauseAlertMinutes,
        defaultUserSettings.dailyGoalMinutes,
        defaultUserSettings.autoStartTimer,
        defaultUserSettings.reduceAnimations
      ]
    );

    const [rows] = await database.execute<
      RowDataPacket[] & UserSettingsDatabaseRow[]
    >(settingsSelect, [userId]);

    return mapUserSettingsFromDatabase(rows[0]);
  }

  async show(request: Request, response: Response) {
    const userId = request.user?.id;

    if (!userId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const settings = await this.getOrCreate(userId);
    return response.status(200).json({ settings });
  }

  async update(request: Request, response: Response) {
    const userId = request.user?.id;

    if (!userId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const currentSettings = await this.getOrCreate(userId);
    const body = request.body as Partial<UserSettings>;

    const settings = {
      defaultTimerMinutes:
        body.defaultTimerMinutes === undefined
          ? currentSettings.defaultTimerMinutes
          : parseIntegerSetting(body.defaultTimerMinutes, "A duracao padrao", 1, 720),
      completionSoundEnabled:
        body.completionSoundEnabled === undefined
          ? currentSettings.completionSoundEnabled
          : parseBooleanSetting(body.completionSoundEnabled, "O som de conclusao"),
      completionSoundVolume:
        body.completionSoundVolume === undefined
          ? currentSettings.completionSoundVolume
          : parseIntegerSetting(body.completionSoundVolume, "O volume", 0, 100),
      pauseAlertMinutes:
        body.pauseAlertMinutes === undefined
          ? currentSettings.pauseAlertMinutes
          : parseIntegerSetting(body.pauseAlertMinutes, "O alerta de pausa", 1, 120),
      dailyGoalMinutes:
        body.dailyGoalMinutes === undefined
          ? currentSettings.dailyGoalMinutes
          : parseIntegerSetting(body.dailyGoalMinutes, "A meta diaria", 1, 1440),
      autoStartTimer:
        body.autoStartTimer === undefined
          ? currentSettings.autoStartTimer
          : parseBooleanSetting(body.autoStartTimer, "O inicio automatico"),
      reduceAnimations:
        body.reduceAnimations === undefined
          ? currentSettings.reduceAnimations
          : parseBooleanSetting(body.reduceAnimations, "A reducao de animacoes")
    };

    await database.execute<ResultSetHeader>(
      `UPDATE user_settings
       SET default_timer_minutes = ?, completion_sound_enabled = ?,
           completion_sound_volume = ?, pause_alert_minutes = ?,
           daily_goal_minutes = ?, auto_start_timer = ?, reduce_animations = ?
       WHERE user_id = ?`,
      [
        settings.defaultTimerMinutes,
        settings.completionSoundEnabled,
        settings.completionSoundVolume,
        settings.pauseAlertMinutes,
        settings.dailyGoalMinutes,
        settings.autoStartTimer,
        settings.reduceAnimations,
        userId
      ]
    );

    const updatedSettings = await this.getOrCreate(userId);
    return response.status(200).json({ settings: updatedSettings });
  }
}
