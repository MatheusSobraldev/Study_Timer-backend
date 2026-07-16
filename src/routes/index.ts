import { Router } from "express";

import { authRoutes } from "./authRoutes";
import { studySessionRoutes } from "./studySessionRoutes";

export const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/study-sessions", studySessionRoutes);
