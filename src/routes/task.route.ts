import { Router } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { taskController } from "../controllers/task.controller.js";
import { taskValidator } from "../validators/task.validator.js";

const router = Router();

router.use(authMiddleware);

// =======================
// TASK CRUD
// =======================

// POST /api/tasks - Tạo task mới
router.post(
  "/",
  requireRole("ADMIN", "HR", "MANAGER"),
  taskValidator.createTask,
  taskController.createTask
);

// GET /api/tasks - Lấy danh sách task
router.get(
  "/",
  taskValidator.getTasks,
  taskController.getTasks
);

// GET /api/tasks/:taskId - Lấy chi tiết task
router.get(
  "/:taskId",
  taskValidator.getTaskById,
  taskController.getTaskById
);

// PUT /api/tasks/:taskId - Cập nhật task
router.put(
  "/:taskId",
  requireRole("ADMIN", "HR", "MANAGER"),
  taskValidator.updateTask,
  taskController.updateTask
);

// DELETE /api/tasks/:taskId - Xóa task
router.delete(
  "/:taskId",
  requireRole("ADMIN", "HR", "MANAGER"),
  taskValidator.deleteTask,
  taskController.deleteTask
);

// =======================
// ASSIGNMENT
// =======================

// PUT /api/tasks/:taskId/assign - Gán task cho nhân viên
router.put(
  "/:taskId/assign",
  requireRole("ADMIN", "HR", "MANAGER"),
  taskValidator.assignTask,
  taskController.assignTask
);

// DELETE /api/tasks/:taskId/unassign/:employeeId - Bỏ gán task
router.delete(
  "/:taskId/unassign/:employeeId",
  requireRole("ADMIN", "HR", "MANAGER"),
  taskValidator.unassignTask,
  taskController.unassignTask
);

// GET /api/tasks/:taskId/assignees - Lấy danh sách nhân viên được gán
router.get(
  "/:taskId/assignees",
  taskValidator.getAssignees,
  taskController.getTaskAssignees
);

// GET /api/tasks/department/:departmentId - lấy task của phòng ban
router.get(
  "/department/:departmentId",
  requireRole("MANAGER"),
  taskValidator.getTasksByDepartment,
  taskController.getTasksByDepartment
);


// =======================
// REVIEW & APPROVAL
// =======================

// PATCH /api/tasks/:taskId/review - Chuyển task sang review
router.patch(
  "/:taskId/review",
  requireRole("ADMIN", "HR", "MANAGER"),
  taskValidator.reviewTask,
  taskController.setTaskReview
);

// PATCH /api/tasks/:taskId/approve - Phê duyệt task
router.patch(
  "/:taskId/approve",
  requireRole("ADMIN", "HR", "MANAGER"),
  taskValidator.approveTask,
  taskController.approveTask
);

// =======================
// PROGRESS & LOGS
// =======================

// GET /api/tasks/:taskId/progress - Lấy tiến độ task
router.get(
  "/:taskId/progress",
  taskValidator.getTaskProgress,
  taskController.getTaskProgress
);

// GET /api/tasks/:taskId/logs - Lấy lịch sử thay đổi task
router.get(
  "/:taskId/logs",
  taskValidator.getTaskLogs,
  taskController.getTaskLogs
);

export default router;