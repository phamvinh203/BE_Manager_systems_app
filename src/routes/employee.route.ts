import { Router } from "express";
import { employeeController } from "../controllers/employee.controller.js";
import { employeeValidator } from "../validators/employee.validator.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// GET /api/employees - Lấy danh sách tất cả nhân viên (All authenticated users)
router.get("/", employeeController.getAll);

// GET /api/employees/:userId - Lấy thông tin chi tiết của một nhân viên theo userID khi login
router.get("/:userId", employeeValidator.getById, employeeController.getById);


// POST /api/employees - Tạo nhân viên mới (Chỉ ADMIN và HR)
router.post(
  "/",
  requireRole("ADMIN", "HR"),
  employeeValidator.create,
  employeeController.create
);

// PUT /api/employees/:id - Cập nhật thông tin nhân viên (Chỉ ADMIN và HR)
router.put(
  "/:id",
  requireRole("ADMIN", "HR"),
  employeeValidator.update,
  employeeController.update
);

// DELETE /api/employees/:id - Xóa nhân viên (Chỉ ADMIN)
router.delete(
  "/:id",
  requireRole("ADMIN"),
  employeeValidator.delete,
  employeeController.delete
);

export default router;
