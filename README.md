# Timer Estudo Backend

Backend em TypeScript, Node.js e Express para um site de foco nos estudos com login e registros de tempo.

## Como rodar

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

No Windows PowerShell, se preferir:

```powershell
cd backend
npm install
Copy-Item .env.example .env
npm run dev
```

Servidor padrao: `http://localhost:3333`.

## Banco de dados

O backend usa MySQL. Configure o arquivo `.env` com os dados do WampServer:

```env
DB_HOST=localhost
DB_USER=projeto_timer_estudo
DB_PASSWORD=sua_senha
DB_NAME=timer_estudo
DB_PORT=3306
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
