import { body, param } from "express-validator";

export const employeeValidator = {
  create: [
    body("code")
      .notEmpty()
      .withMessage("Mã nhân viên không được để trống")
      .isString()
      .withMessage("Mã nhân viên phải là chuỗi"),
    body("firstName")
      .notEmpty()
      .withMessage("Tên không được để trống")
      .isString()
      .withMessage("Tên phải là chuỗi"),
    body("lastName")
      .notEmpty()
      .withMessage("Họ không được để trống")
      .isString()
      .withMessage("Họ phải là chuỗi"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Email không hợp lệ"),
    body("phone")
      .optional()
      .isString()
      .withMessage("Số điện thoại phải là chuỗi"),
    body("position")
      .optional()
      .isString()
      .withMessage("Chức vụ phải là chuỗi"),
    body("department")
      .optional()
      .isString()
      .withMessage("Phòng ban phải là chuỗi"),
    body("salary")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Lương phải là số dương"),
    body("status")
      .optional()
      .isIn(["ACTIVE", "INACTIVE"])
      .withMessage("Trạng thái phải là ACTIVE hoặc INACTIVE"),
    body("hiredAt")
      .notEmpty()
      .withMessage("Ngày vào làm không được để trống")
      .isISO8601()
      .withMessage("Ngày vào làm không hợp lệ"),
  ],

  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID nhân viên không hợp lệ"),
    body("code")
      .optional()
      .isString()
      .withMessage("Mã nhân viên phải là chuỗi"),
    body("firstName")
      .optional()
      .isString()
      .withMessage("Tên phải là chuỗi"),
    body("lastName")
      .optional()
      .isString()
      .withMessage("Họ phải là chuỗi"),
    body("email")
      .optional()
      .isEmail()
      .withMessage("Email không hợp lệ"),
    body("phone")
      .optional()
      .isString()
      .withMessage("Số điện thoại phải là chuỗi"),
    body("position")
      .optional()
      .isString()
      .withMessage("Chức vụ phải là chuỗi"),
    body("department")
      .optional()
      .isString()
      .withMessage("Phòng ban phải là chuỗi"),
    body("salary")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Lương phải là số dương"),
    body("status")
      .optional()
      .isIn(["ACTIVE", "INACTIVE"])
      .withMessage("Trạng thái phải là ACTIVE hoặc INACTIVE"),
    body("hiredAt")
      .optional()
      .isISO8601()
      .withMessage("Ngày vào làm không hợp lệ"),
  ],

  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID nhân viên không hợp lệ"),
  ],

  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID nhân viên không hợp lệ"),
  ],
};
