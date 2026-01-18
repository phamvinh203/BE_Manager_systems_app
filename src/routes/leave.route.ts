import { Router } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware.js";
import { leaveController } from "../controllers/leave.controller.js";
import { leaveValidator } from "../validators/leave.validator.js";

const router = Router();

router.use(authMiddleware);
// =======================
// CREATE
// =======================

// POST /api/leave/requests - Tạo đơn xin nghỉ/WFH
router.post(
  "/requests",
  leaveValidator.createRequest,
  leaveController.createRequest
);

// =======================
// LIST (STATIC PATHS)
// =======================

// GET /api/leave/requests/me - Đơn của tôi
router.get(
  "/requests/me",
  leaveController.getMyRequests
);

// GET /api/leave/requests/team - Đơn cấp dưới (Manager)
router.get(
  "/requests/team",
  requireRole("ADMIN", "HR", "MANAGER"),
  leaveController.getTeamRequests
);

// GET /api/leave/requests/all - Tất cả đơn (HR/Admin)
router.get(
  "/requests/all",
  requireRole("ADMIN", "HR"),
  leaveValidator.getRequests,
  leaveController.getAllRequests
);

// =======================
// ACTIONS WITH ID
// =======================

// PATCH /api/leave/requests/:id/cancel - Hủy đơn (owner)
router.patch(
  "/requests/:id/cancel",
  leaveValidator.cancelRequest,
  leaveController.cancelRequest
);

// PATCH /api/leave/requests/:id/approve - Duyệt đơn
router.patch(
  "/requests/:id/approve",
  requireRole("ADMIN", "HR", "MANAGER"),
  leaveValidator.processRequest,
  leaveController.approveRequest
);

// PATCH /api/leave/requests/:id/reject - Từ chối đơn
router.patch(
  "/requests/:id/reject",
  requireRole("ADMIN", "HR", "MANAGER"),
  leaveValidator.processRequest,
  leaveController.rejectRequest
);

// =======================
// DETAIL (LAST)
// =======================

// GET /api/leave/requests/:id - Chi tiết đơn
router.get(
  "/requests/:id",
  leaveValidator.getRequestById,
  leaveController.getRequestById
);



// GET /api/leave/balance/me - Xem số ngày phép của mình - All
router.get(
  "/balance/me",
  leaveValidator.getMyBalance,
  leaveController.getMyBalance
);

// GET /api/leave/balance/:employeeId - Xem số ngày phép của 1 nhân viên - HR/Admin
router.get(
  "/balance/:employeeId",
  requireRole("ADMIN", "HR"),
  leaveValidator.getBalanceByEmployee,
  leaveController.getEmployeeBalance
);

// PUT /api/leave/balance/:employeeId - Cập nhật số ngày phép - HR/Admin
router.put(
  "/balance/:employeeId",
  requireRole("ADMIN", "HR"),
  leaveValidator.updateBalance,
  leaveController.updateBalance
);

// POST /api/leave/balance/init - Khởi tạo balance đầu năm cho tất cả NV - Admin
router.post(
  "/balance/init",
  requireRole("ADMIN", "HR"),
  leaveValidator.initBalance,
  leaveController.initializeBalance
);

export default router;
