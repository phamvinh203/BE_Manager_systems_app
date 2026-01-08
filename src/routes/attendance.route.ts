// src/routes/attendance.route.ts
import { Router } from "express";
import { attendanceController } from "../controllers/attendance.controller.js";
import { attendanceValidator } from "../validators/attendance.validator.js";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

// POST /attendance/check-in - Tất cả nhân viên
router.post("/check-in", attendanceValidator.checkIn, attendanceController.checkIn);

// POST /attendance/check-out - Tất cả nhân viên
router.post("/check-out", attendanceValidator.checkOut, attendanceController.checkOut);

// GET /attendance/me - Nhân viên xem công của mình
router.get("/me", attendanceValidator.getMyAttendance, attendanceController.getMyAttendance);

// GET /attendance - HR/Admin xem toàn bộ
router.get(
  "/",
  requireRole("ADMIN", "HR"),
  attendanceValidator.getAll,
  attendanceController.getAll
);



export default router;