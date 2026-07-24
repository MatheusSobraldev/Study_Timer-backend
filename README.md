# Timer Estudo Backend

Backend em TypeScript, Node.js e Express para um site de foco nos estudos com login e registros de tempo.

## Tecnologias

- Node.js
- Express
- TypeScript
- MySQL
- JWT
- bcryptjs


Servidor padrao: `http://localhost:3333`.

## Variaveis de ambiente

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
  duration_in_seconds INT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL,
  finished_at DATETIME NOT NULL,
  notes TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_study_sessions_users
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_study_sessions_duration
    CHECK (duration_in_minutes > 0 AND duration_in_seconds > 0),

  CONSTRAINT chk_study_sessions_dates
    CHECK (finished_at > started_at)
);

CREATE INDEX idx_study_sessions_user_id
  ON study_sessions(user_id);

CREATE INDEX idx_study_sessions_started_at
  ON study_sessions(started_at);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id CHAR(36) PRIMARY KEY,
  default_timer_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 25,
  completion_sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  completion_sound_volume TINYINT UNSIGNED NOT NULL DEFAULT 75,
  completion_sound VARCHAR(32) NOT NULL DEFAULT 'disco',
  pause_alert_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 5,
  daily_goal_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  auto_start_timer BOOLEAN NOT NULL DEFAULT FALSE,
  reduce_animations BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_user_settings_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);
```

Se a tabela `study_sessions` foi criada antes do suporte a segundos, execute uma vez:

```sql
ALTER TABLE study_sessions
  ADD COLUMN duration_in_seconds INT UNSIGNED NULL
  AFTER duration_in_minutes;

UPDATE study_sessions
SET duration_in_seconds = duration_in_minutes * 60
WHERE duration_in_seconds IS NULL;

ALTER TABLE study_sessions
  MODIFY duration_in_seconds INT UNSIGNED NOT NULL;
```

Se a tabela `user_settings` ja existia antes da opcao de toques, execute uma vez:

```sql
ALTER TABLE user_settings
  ADD COLUMN completion_sound VARCHAR(32) NOT NULL DEFAULT 'disco'
  AFTER completion_sound_volume;
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

### Configuracoes

As rotas abaixo tambem exigem header `Authorization: Bearer <token>`.

- `GET /api/settings`
- `PUT /api/settings`

O campo `completionSound` aceita: `disco`, `mario`, `vitoria`, `congrats`,
`voila`, `bob1`, `bob2` e `hanna`.

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
