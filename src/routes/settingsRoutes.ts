import { Router } from "express";

import { SettingsController } from "../controllers/SettingsController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";

export const settingsRoutes = Router();
const settingsController = new SettingsController();

settingsRoutes.use(authMiddleware);

settingsRoutes.get(
  "/",
  asyncHandler((request, response) =>
    settingsController.show(request, response)
  )
);

settingsRoutes.put(
  "/",
  asyncHandler((request, response) =>
    settingsController.update(request, response)
  )
);
