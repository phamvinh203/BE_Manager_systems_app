import { Router } from "express";
import { positionController } from "../controllers/position.controller.js";
import { positionValidator } from "../validators/position.validator.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// GET /api/positions - Lấy danh sách tất cả vị trí công việc (All authenticated users)
router.get("/", positionController.getAll);

// GET /api/positions/:id - Lấy thông tin chi tiết của một vị trí công việc (All authenticated users)
router.get("/:id", positionValidator.getById, positionController.getById);

// POST /api/positions - Tạo vị trí công việc mới (Chỉ ADMIN và HR)
router.post(
  "/",
  requireRole("ADMIN", "HR"),
  positionValidator.create,
  positionController.create
);

// PUT /api/positions/:id - Cập nhật thông tin vị trí công việc (Chỉ ADMIN và HR)
router.put(
  "/:id",
  requireRole("ADMIN", "HR"),
  positionValidator.update,
  positionController.update
);

// DELETE /api/positions/:id - Xóa vị trí công việc (Chỉ ADMIN)
router.delete(
  "/:id",
  requireRole("ADMIN"),
  positionValidator.delete,
  positionController.delete
);

export default router;
