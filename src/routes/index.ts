import { Router } from "express";

import { authRoutes } from "./authRoutes";
import { settingsRoutes } from "./settingsRoutes";
import { studySessionRoutes } from "./studySessionRoutes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/settings", settingsRoutes);
routes.use("/study-sessions", studySessionRoutes);
