import { Router } from "express";

import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";

export const authRoutes = Router();
const authController = new AuthController();

authRoutes.post(
  "/register",
  asyncHandler((request, response) => authController.register(request, response))
);
authRoutes.post(
  "/login",
  asyncHandler((request, response) => authController.login(request, response))
);
authRoutes.get("/me", authMiddleware, (request, response) =>
  authController.me(request, response)
);
