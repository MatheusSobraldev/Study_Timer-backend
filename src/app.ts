import cors from "cors";
import express from "express";
import morgan from "morgan";

import { env } from "./config/env";
import { errorHandler } from "./middlewares/errorHandler";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { routes } from "./routes";

export const app = express();

app.use(cors({ origin: env.frontendUrl }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  response.status(200).json({
    status: "ok",
    service: "timer-estudo-backend"
  });
});

app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);
