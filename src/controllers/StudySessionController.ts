import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";

import { database } from "../config/database";
import { AppError } from "../errors/AppError";
import {
  mapStudySessionFromDatabase,
  StudySession,
  StudySessionDatabaseRow
} from "../models/StudySession";

export class StudySessionController {
  async index(request: Request, response: Response) {
    const userId = request.user?.id;

    if (!userId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const [rows] = await database.execute<
      RowDataPacket[] & StudySessionDatabaseRow[]
    >(
      `SELECT id, user_id, title, subject, duration_in_minutes, started_at, finished_at, notes, created_at
       FROM study_sessions
       WHERE user_id = ?
       ORDER BY started_at DESC`,
      [userId]
    );
    const sessions = rows.map(mapStudySessionFromDatabase);

    const totalMinutes = sessions.reduce(
      (sum, session) => sum + session.durationInMinutes,
      0
    );

    return response.status(200).json({
      sessions,
      summary: {
        totalSessions: sessions.length,
        totalMinutes
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
      `SELECT id, user_id, title, subject, duration_in_minutes, started_at, finished_at, notes, created_at
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
    const { title, subject, durationInMinutes, startedAt, finishedAt, notes } =
      request.body;

    if (!userId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    if (!title || !durationInMinutes || !startedAt || !finishedAt) {
      throw new AppError(
        "Titulo, duracao, inicio e fim do estudo sao obrigatorios."
      );
    }

    const duration = Number(durationInMinutes);
    const parsedStartedAt = new Date(startedAt);
    const parsedFinishedAt = new Date(finishedAt);

    if (Number.isNaN(duration) || duration <= 0) {
      throw new AppError("A duracao deve ser maior que zero.");
    }

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
      durationInMinutes: duration,
      startedAt: parsedStartedAt,
      finishedAt: parsedFinishedAt,
      notes: notes ? String(notes).trim() : undefined,
      createdAt: new Date()
    };

    await database.execute<ResultSetHeader>(
      `INSERT INTO study_sessions
        (id, user_id, title, subject, duration_in_minutes, started_at, finished_at, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        session.userId,
        session.title,
        session.subject ?? null,
        session.durationInMinutes,
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
    const { title, subject, durationInMinutes, startedAt, finishedAt, notes } =
      request.body;

    if (!userId) {
      throw new AppError("Usuario nao autenticado.", 401);
    }

    const [rows] = await database.execute<
      RowDataPacket[] & StudySessionDatabaseRow[]
    >(
      `SELECT id, user_id, title, subject, duration_in_minutes, started_at, finished_at, notes, created_at
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

    if (durationInMinutes !== undefined) {
      const duration = Number(durationInMinutes);

      if (Number.isNaN(duration) || duration <= 0) {
        throw new AppError("A duracao deve ser maior que zero.");
      }

      session.durationInMinutes = duration;
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
       SET title = ?, subject = ?, duration_in_minutes = ?, started_at = ?, finished_at = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [
        session.title,
        session.subject ?? null,
        session.durationInMinutes,
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
