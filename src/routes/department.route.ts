import { Router } from "express";
import { departmentController } from "../controllers/department.controller.js";
import { departmentValidator } from "../validators/department.validator.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// GET /api/departments - Lấy danh sách tất cả phòng ban (All authenticated users)
router.get("/", departmentController.getAll);

// GET /api/departments/:id - Lấy thông tin chi tiết của một phòng ban (All authenticated users)
router.get("/:id", departmentValidator.getById, departmentController.getById);

// POST /api/departments - Tạo phòng ban mới (Chỉ ADMIN và HR)
router.post(
  "/",
  requireRole("ADMIN", "HR"),
  departmentValidator.create,
  departmentController.create
);

// PUT /api/departments/:id - Cập nhật thông tin phòng ban (Chỉ ADMIN và HR)
router.put(
  "/:id",
  requireRole("ADMIN", "HR"),
  departmentValidator.update,
  departmentController.update
);

// DELETE /api/departments/:id - Xóa phòng ban (Chỉ ADMIN)
router.delete(
  "/:id",
  requireRole("ADMIN"),
  departmentValidator.delete,
  departmentController.delete
);

// thêm manager cho phòng ban
router.post(
  "/:departmentId/assign-manager/:employeeId",
  requireRole("ADMIN", "HR"),
  departmentValidator.assignManager,
  departmentController.assignManager
);

// sửa manager cho phòng ban
router.put(
  "/:departmentId/change-manager/:newManagerId",
  requireRole("ADMIN", "HR"),
  departmentValidator.changeManager,
  departmentController.changeManager
);

// xem các manaeger của phòng ban
router.get(
  "/:departmentId/managers",
  requireRole("ADMIN", "HR"),
  departmentValidator.getManagers,
  departmentController.getManagers
);

export default router;
