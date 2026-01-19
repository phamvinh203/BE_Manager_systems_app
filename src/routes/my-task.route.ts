import { Router } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { taskController } from "../controllers/task.controller.js";
import { taskValidator } from "../validators/task.validator.js";


const router = Router();
router.use(authMiddleware);

// GET /api/my-tasks
router.get(
  "/",
  taskValidator.getMyTasks,
  taskController.getMyTasks
);

// GET /api/my-tasks/:assignmentId
router.get(
  "/:assignmentId",
  taskValidator.getMyTaskDetail,
  taskController.getMyTaskDetail
);

// PATCH /api/my-tasks/:assignmentId
router.patch(
  "/:assignmentId",
  taskValidator.updateAssignment,
  taskController.updateAssignment
);

// PATCH /api/my-tasks/:assignmentId/complete
router.patch(
  "/:assignmentId/complete",
  taskValidator.completeAssignment,
  taskController.completeAssignment
);

export default router;
