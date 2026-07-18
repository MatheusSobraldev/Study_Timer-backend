import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";

import { database } from "../config/database";
import { AppError } from "../errors/AppError";
import {
  mapStudySessionFromDatabase,
  StudySession,
  StudySessionDatabaseRow
} from "../models/StudySession";

function parseDurationInSeconds(
  durationInSeconds: unknown,
  durationInMinutes: unknown
) {
  const receivedSeconds = durationInSeconds !== undefined;
  const duration = receivedSeconds
    ? Number(durationInSeconds)
    : Number(durationInMinutes) * 60;

  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    (receivedSeconds && !Number.isInteger(duration))
  ) {
    throw new AppError(
      "A duracao deve ser informada em segundos inteiros e ser maior que zero."
    );
  }

  return Math.round(duration);
}

function getLegacyDurationInMinutes(durationInSeconds: number) {
  return Math.max(1, Math.ceil(durationInSeconds / 60));
}

export class StudySessionController {
  async index(request: Request, response: Response) {
    const userId = request.user?.id;

    if (!userId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const [rows] = await database.execute<
      RowDataPacket[] & StudySessionDatabaseRow[]
    >(
      `SELECT id, user_id, title, subject, duration_in_seconds, duration_in_minutes, started_at, finished_at, notes, created_at
       FROM study_sessions
       WHERE user_id = ?
       ORDER BY started_at DESC`,
      [userId]
    );
    const sessions = rows.map(mapStudySessionFromDatabase);

    const totalSeconds = sessions.reduce(
      (sum, session) => sum + session.durationInSeconds,
      0
    );

    return response.status(200).json({
      sessions,
      summary: {
        totalSessions: sessions.length,
        totalSeconds,
        totalMinutes: totalSeconds / 60
      }
    });
  }

  async show(request: Request, response: Response) {
    const userId = request.user?.id;
    const { id } = request.params;

    if (!userId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const [rows] = await database.execute<
      RowDataPacket[] & StudySessionDatabaseRow[]
    >(
      `SELECT id, user_id, title, subject, duration_in_seconds, duration_in_minutes, started_at, finished_at, notes, created_at
       FROM study_sessions
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, userId]
    );
    const session = rows[0] ? mapStudySessionFromDatabase(rows[0]) : undefined;

    if (!session) {
      throw new AppError("Registro de estudo nao encontrado.", 404);
    }

    return response.status(200).json({ session });
  }

  async create(request: Request, response: Response) {
    const userId = request.user?.id;
    const {
      title,
      subject,
      durationInSeconds,
      durationInMinutes,
      startedAt,
      finishedAt,
      notes
    } = request.body;

    if (!userId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    if (
      !title ||
      (durationInSeconds === undefined && durationInMinutes === undefined) ||
      !startedAt ||
      !finishedAt
    ) {
      throw new AppError(
        "Titulo, duracao, inicio e fim do estudo sao obrigatorios."
      );
    }

    const duration = parseDurationInSeconds(
      durationInSeconds,
      durationInMinutes
    );
    const parsedStartedAt = new Date(startedAt);
    const parsedFinishedAt = new Date(finishedAt);

    if (
      Number.isNaN(parsedStartedAt.getTime()) ||
      Number.isNaN(parsedFinishedAt.getTime())
    ) {
      throw new AppError("Datas de inicio ou fim invalidas.");
    }

    if (parsedFinishedAt <= parsedStartedAt) {
      throw new AppError("A data final deve ser maior que a data inicial.");
    }

    const session: StudySession = {
      id: crypto.randomUUID(),
      userId,
      title: String(title).trim(),
      subject: subject ? String(subject).trim() : undefined,
      durationInSeconds: duration,
      durationInMinutes: duration / 60,
      startedAt: parsedStartedAt,
      finishedAt: parsedFinishedAt,
      notes: notes ? String(notes).trim() : undefined,
      createdAt: new Date()
    };

    await database.execute<ResultSetHeader>(
      `INSERT INTO study_sessions
        (id, user_id, title, subject, duration_in_seconds, duration_in_minutes,
         started_at, finished_at, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.userId,
        session.title,
        session.subject ?? null,
        session.durationInSeconds,
        getLegacyDurationInMinutes(session.durationInSeconds),
        session.startedAt,
        session.finishedAt,
        session.notes ?? null,
        session.createdAt
      ]
    );

    return response.status(201).json({ session });
  }

  async update(request: Request, response: Response) {
    const userId = request.user?.id;
    const { id } = request.params;
    const {
      title,
      subject,
      durationInSeconds,
      durationInMinutes,
      startedAt,
      finishedAt,
      notes
    } = request.body;

    if (!userId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const [rows] = await database.execute<
      RowDataPacket[] & StudySessionDatabaseRow[]
    >(
      `SELECT id, user_id, title, subject, duration_in_seconds, duration_in_minutes, started_at, finished_at, notes, created_at
       FROM study_sessions
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
      [id, userId]
    );
    const session = rows[0] ? mapStudySessionFromDatabase(rows[0]) : undefined;

    if (!session) {
      throw new AppError("Registro de estudo nao encontrado.", 404);
    }

    if (title !== undefined) {
      session.title = String(title).trim();
    }

    if (subject !== undefined) {
      session.subject = subject ? String(subject).trim() : undefined;
    }

    if (durationInSeconds !== undefined || durationInMinutes !== undefined) {
      const duration = parseDurationInSeconds(
        durationInSeconds,
        durationInMinutes
      );

      session.durationInSeconds = duration;
      session.durationInMinutes = duration / 60;
    }

    if (startedAt !== undefined) {
      const parsedStartedAt = new Date(startedAt);

      if (Number.isNaN(parsedStartedAt.getTime())) {
        throw new AppError("Data de inicio invalida.");
      }

      session.startedAt = parsedStartedAt;
    }

    if (finishedAt !== undefined) {
      const parsedFinishedAt = new Date(finishedAt);

      if (Number.isNaN(parsedFinishedAt.getTime())) {
        throw new AppError("Data final invalida.");
      }

      session.finishedAt = parsedFinishedAt;
    }

    if (session.finishedAt <= session.startedAt) {
      throw new AppError("A data final deve ser maior que a data inicial.");
    }

    if (notes !== undefined) {
      session.notes = notes ? String(notes).trim() : undefined;
    }

    await database.execute<ResultSetHeader>(
      `UPDATE study_sessions
       SET title = ?, subject = ?, duration_in_seconds = ?, duration_in_minutes = ?,
           started_at = ?, finished_at = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        session.title,
        session.subject ?? null,
        session.durationInSeconds,
        getLegacyDurationInMinutes(session.durationInSeconds),
        session.startedAt,
        session.finishedAt,
        session.notes ?? null,
        session.id,
        session.userId
      ]
    );

    return response.status(200).json({ session });
  }

  async delete(request: Request, response: Response) {
    const userId = request.user?.id;
    const { id } = request.params;

    if (!userId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const [result] = await database.execute<ResultSetHeader>(
      "DELETE FROM study_sessions WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      throw new AppError("Registro de estudo nao encontrado.", 404);
    }

    return response.status(204).send();
  }
}
