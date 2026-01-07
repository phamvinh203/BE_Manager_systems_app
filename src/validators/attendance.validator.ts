// src/validators/attendance.validator.ts
import { body, query } from "express-validator";

export const attendanceValidator = {
  checkIn: [
    body("time")
      .notEmpty()
      .withMessage("Vui lòng nhập giờ check-in")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Định dạng giờ không hợp lệ (HH:mm)"),
  ],

  checkOut: [
    body("time")
      .notEmpty()
      .withMessage("Vui lòng nhập giờ check-out")
      .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Định dạng giờ không hợp lệ (HH:mm)"),
  ],

  getMyAttendance: [
    query("month")
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage("Tháng không hợp lệ"),
    query("year")
      .optional()
      .isInt({ min: 2020 })
      .withMessage("Năm không hợp lệ"),
  ],

  getAll: [
    query("employeeId").optional().isInt().withMessage("ID nhân viên không hợp lệ"),
    query("month").optional().isInt({ min: 1, max: 12 }).withMessage("Tháng không hợp lệ"),
    query("year").optional().isInt({ min: 2020 }).withMessage("Năm không hợp lệ"),
    query("date").optional().isISO8601().withMessage("Ngày không hợp lệ"),
  ],
};