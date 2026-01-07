import { Router } from "express";
import { employeeController } from "../controllers/employee.controller.js";
import { employeeValidator } from "../validators/employee.validator.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Áp dụng middleware xác thực cho tất cả các routes
router.use(authMiddleware);

// GET /api/employees/user/:userId - Lấy thông tin nhân viên theo User ID (All authenticated users)
router.get("/user/:userId", employeeController.getEmployeeByUserId);

// GET /api/employees - Lấy danh sách tất cả nhân viên (All authenticated users)
router.get("/", employeeController.getAll);


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
