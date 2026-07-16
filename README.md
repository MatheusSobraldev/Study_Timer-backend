# Timer Estudo Backend

Backend em TypeScript, Node.js e Express para um site de foco nos estudos com login e registros de tempo.

## Tecnologias

- Node.js
- Express
- TypeScript
- MySQL
- JWT
- bcryptjs

## Como rodar

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

No Windows PowerShell:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Servidor padrao: `http://localhost:3333`.

## Variaveis de ambiente

Configure o arquivo `.env` com os dados do seu ambiente local ou do banco em nuvem:

```env
PORT=3333
JWT_SECRET=troque_essa_chave_em_producao
JWT_EXPIRES_IN=1d
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=timer_estudo
DB_PORT=3306
```

Nunca envie o arquivo `.env` para o GitHub.

## Banco de dados

Script base para criar o banco e as tabelas:

```sql
CREATE DATABASE IF NOT EXISTS timer_estudo
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE timer_estudo;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(150) NOT NULL,
  subject VARCHAR(120),
  duration_in_minutes INT NOT NULL,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NOT NULL,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_study_sessions_users
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_study_sessions_duration
    CHECK (duration_in_minutes > 0),

  CONSTRAINT chk_study_sessions_dates
    CHECK (finished_at > started_at)
);

CREATE INDEX idx_study_sessions_user_id
  ON study_sessions(user_id);

CREATE INDEX idx_study_sessions_started_at
  ON study_sessions(started_at);
```

## Rotas

### Saude

- `GET /health`

### Autenticacao

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Registros de estudo

Todas as rotas abaixo exigem header `Authorization: Bearer <token>`.

- `GET /api/study-sessions`
- `GET /api/study-sessions/:id`
- `POST /api/study-sessions`
- `PUT /api/study-sessions/:id`
- `DELETE /api/study-sessions/:id`

Exemplo de registro:

```json
{
  "title": "Pomodoro de matematica",
  "subject": "Matematica",
  "durationInMinutes": 25,
  "startedAt": "2026-07-16T13:00:00.000Z",
  "finishedAt": "2026-07-16T13:25:00.000Z",
  "notes": "Revisei equacoes do segundo grau."
}
```

## Estrutura principal

- `src/config/database.ts`: pool de conexao MySQL.
- `src/controllers`: regras das requisicoes.
- `src/routes`: rotas da API.
- `src/middlewares`: autenticacao, erros e rotas inexistentes.
- `src/models`: tipos e conversao entre MySQL e TypeScript.

## Scripts

- `npm run dev`: inicia o servidor em desenvolvimento.
- `npm run build`: compila o TypeScript.
- `npm start`: executa a versao compilada.
- `npm run typecheck`: valida os tipos sem gerar build.
