export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface UserDatabaseRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
}

export function mapUserFromDatabase(row: UserDatabaseRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at
  };
}

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _passwordHash, ...publicUser } = user;

  return publicUser;
}
