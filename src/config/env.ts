function readEnv(name: string, fallback: string) {
  const value = process.env[name] ?? fallback;

  return value.trim().replace(/^["']|["']$/g, "");
}

function readNumberEnv(name: string, fallback: string) {
  const value = Number(readEnv(name, fallback));

  if (Number.isNaN(value)) {
    throw new Error(`${name} deve ser um numero valido.`);
  }

  return value;
}

const port = readNumberEnv("PORT", "3333");
const databasePort = readNumberEnv("DB_PORT", "3306");


export const env = {
  port,
  jwtSecret: readEnv("JWT_SECRET", "dev_timer_estudo_secret"),
  jwtExpiresIn: readEnv("JWT_EXPIRES_IN", "1d"),
  frontendUrl: readEnv("FRONTEND_URL", "http://localhost:3000"),
  database: {
    host: readEnv("DB_HOST", "localhost"),
    user: readEnv("DB_USER", "root"),
    password: readEnv("DB_PASSWORD", ""),
    name: readEnv("DB_NAME", "timer_estudo"),
    port: databasePort
  }
};
