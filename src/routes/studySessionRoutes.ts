import { Router } from "express";

import { StudySessionController } from "../controllers/StudySessionController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { asyncHandler } from "../middlewares/asyncHandler";

export const studySessionRoutes = Router();
const studySessionController = new StudySessionController();

studySessionRoutes.use(authMiddleware);

studySessionRoutes.get(
  "/",
  asyncHandler((request, response) =>
    studySessionController.index(request, response)
  )
);
studySessionRoutes.get(
  "/:id",
  asyncHandler((request, response) =>
    studySessionController.show(request, response)
  )
);
studySessionRoutes.post(
  "/",
  asyncHandler((request, response) =>
    studySessionController.create(request, response)
  )
);
studySessionRoutes.put(
  "/:id",
  asyncHandler((request, response) =>
    studySessionController.update(request, response)
  )
);
studySessionRoutes.delete(
  "/:id",
  asyncHandler((request, response) =>
    studySessionController.delete(request, response)
  )
);
