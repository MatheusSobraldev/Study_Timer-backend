import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { SignOptions } from "jsonwebtoken";
import { ResultSetHeader, RowDataPacket } from "mysql2";

import { database } from "../config/database";
import { env } from "../config/env";
import { AppError } from "../errors/AppError";
import {
  mapUserFromDatabase,
  toPublicUser,
  User,
  UserDatabaseRow
} from "../models/User";

function createToken(user: User) {
  const signOptions: SignOptions = {
    subject: user.id,
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  };

  return jwt.sign({}, env.jwtSecret, {
    ...signOptions
  });
}

export class AuthController {
  async register(request: Request, response: Response) {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      throw new AppError("Nome, email e senha sao obrigatorios.");
    }

    if (password.length < 6) {
      throw new AppError("A senha deve ter pelo menos 6 caracteres.");
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existingUsers] = await database.execute<
      RowDataPacket[] & UserDatabaseRow[]
    >("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);

    if (existingUsers.length > 0) {
      throw new AppError("Ja existe um usuario com esse email.", 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      id: crypto.randomUUID(),
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date()
    };

    await database.execute<ResultSetHeader>(
      "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
      [user.id, user.name, user.email, user.passwordHash, user.createdAt]
    );

    return response.status(201).json({
      user: toPublicUser(user),
      token: createToken(user)
    });
  }

  async login(request: Request, response: Response) {
    const { email, password } = request.body;

    if (!email || !password) {
      throw new AppError("Email e senha sao obrigatorios.");
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [users] = await database.execute<RowDataPacket[] & UserDatabaseRow[]>(
      "SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );
    const user = users[0] ? mapUserFromDatabase(users[0]) : undefined;

    if (!user) {
      throw new AppError("Email ou senha invalidos.", 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError("Email ou senha invalidos.", 401);
    }

    return response.status(200).json({
      user: toPublicUser(user),
      token: createToken(user)
    });
  }

  me(request: Request, response: Response) {
    return response.status(200).json({
      user: request.user
    });
  }
}
