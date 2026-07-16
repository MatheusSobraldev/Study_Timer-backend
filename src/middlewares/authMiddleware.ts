import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2";

import { database } from "../config/database";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import { mapUserFromDatabase, toPublicUser, UserDatabaseRow } from "../models/User";

interface TokenPayload {
  sub: string;
}

export function authMiddleware(
  request: Request,
  _response: Response,
  next: NextFunction
) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError("Token nao informado.", 401);
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Formato do token invalido.", 401);
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as TokenPayload;
    database
      .execute<RowDataPacket[] & UserDatabaseRow[]>(
        "SELECT id, name, email, password_hash, created_at FROM users WHERE id = ? LIMIT 1",
        [payload.sub]
      )
      .then(([rows]) => {
        const row = rows[0];

        if (!row) {
          return next(new AppError("Usuario nao encontrado.", 401));
        }

        request.user = toPublicUser(mapUserFromDatabase(row));

        return next();
      })
      .catch(() => next(new AppError("Token invalido ou expirado.", 401)));
  } catch {
    return next(new AppError("Token invalido ou expirado.", 401));
  }
}
