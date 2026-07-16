const port = Number(process.env.PORT ?? 3333);

if (Number.isNaN(port)) {
  throw new Error("PORT deve ser um numero valido.");
}

export const env = {
  port,
  jwtSecret: process.env.JWT_SECRET ?? "dev_timer_estudo_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  database: {
    host: process.env.DB_HOST ?? "localhost",
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    name: process.env.DB_NAME ?? "timer_estudo",
    port: Number(process.env.DB_PORT ?? 3306)
  }
};
