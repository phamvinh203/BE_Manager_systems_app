import { body, param, query } from "express-validator";

export const leaveValidator = {
  createRequest: [
    body("leaveType")
      .notEmpty()
      .withMessage("Loại nghỉ không được để trống")
      .isIn(["ANNUAL", "SICK", "UNPAID", "WFH"])
      .withMessage("Loại nghỉ phải là ANNUAL, SICK, UNPAID hoặc WFH"),
    body("startDate")
      .notEmpty()
      .withMessage("Ngày bắt đầu không được để trống")
      .isISO8601()
      .withMessage("Ngày bắt đầu không hợp lệ"),
    body("endDate")
      .notEmpty()
      .withMessage("Ngày kết thúc không được để trống")
      .isISO8601()
      .withMessage("Ngày kết thúc không hợp lệ")
      .custom((endDate, { req }) => {
        const startDate = new Date(req.body.startDate);
        const end = new Date(endDate);
        if (end < startDate) {
          throw new Error("Ngày kết thúc phải sau ngày bắt đầu");
        }
        return true;
      }),
    body("reason")
      .optional()
      .isString()
      .withMessage("Lý do phải là chuỗi")
      .trim()
      .isLength({ max: 500 })
      .withMessage("Lý do không được quá 500 ký tự"),
  ],

  // Get request by id
  getRequestById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID đơn xin nghỉ không hợp lệ"),
  ],

  // Cancel request
  cancelRequest: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID đơn xin nghỉ không hợp lệ"),
  ],

  // Approve/Reject request
  processRequest: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID đơn xin nghỉ không hợp lệ"),
    body("rejectNote")
      .optional()
      .isString()
      .withMessage("Ghi chú từ chối phải là chuỗi")
      .trim()
      .isLength({ max: 500 })
      .withMessage("Ghi chú không được quá 500 ký tự"),
  ],

  // Get leave balance by employee id
  getBalanceByEmployee: [
    param("employeeId")
      .isInt({ min: 1 })
      .withMessage("ID nhân viên không hợp lệ"),
    query("year")
      .optional()
      .isInt({ min: 2020, max: 2100 })
      .withMessage("Năm phải từ 2020-2100"),
  ],

  // Update leave balance
  updateBalance: [
    param("employeeId")
      .isInt({ min: 1 })
      .withMessage("ID nhân viên không hợp lệ"),
    body("year")
      .notEmpty()
      .withMessage("Năm không được để trống")
      .isInt({ min: 2020, max: 2100 })
      .withMessage("Năm phải từ 2020-2100"),
    body("leaveType")
      .notEmpty()
      .withMessage("Loại nghỉ không được để trống")
      .isIn(["ANNUAL", "SICK", "UNPAID", "WFH"])
      .withMessage("Loại nghỉ phải là ANNUAL, SICK, UNPAID hoặc WFH"),
    body("totalDays")
      .notEmpty()
      .withMessage("Tổng số ngày không được để trống")
      .isFloat({ min: 0 })
      .withMessage("Tổng số ngày phải là số không âm"),
  ],

  // Initialize balance
  initBalance: [
    body("year")
      .notEmpty()
      .withMessage("Năm không được để trống")
      .isInt({ min: 2020, max: 2100 })
      .withMessage("Năm phải từ 2020-2100"),
  ],

  // Query params
  getRequests: [
    query("status")
      .optional()
      .isIn(["PENDING", "APPROVED", "REJECTED", "CANCELLED"])
      .withMessage("Trạng thái không hợp lệ"),
    query("employeeId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("ID nhân viên không hợp lệ"),
    query("year")
      .optional()
      .isInt({ min: 2020, max: 2100 })
      .withMessage("Năm phải từ 2020-2100"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Trang phải là số nguyên dương"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit phải từ 1-100"),
  ],

  getMyBalance: [
    query("year")
      .optional()
      .isInt({ min: 2020, max: 2100 })
      .withMessage("Năm phải từ 2020-2100"),
  ],
};
