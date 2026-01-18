import { body, param } from "express-validator";

export const departmentValidator = {
  create: [
    body("name")
      .notEmpty()
      .withMessage("Tên phòng ban không được để trống")
      .isString()
      .withMessage("Tên phòng ban phải là chuỗi")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên phòng ban phải từ 2-100 ký tự"),
    body("managerId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("ID quản lý phải là số nguyên dương"),
  ],

  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID phòng ban không hợp lệ"),
    body("name")
      .optional()
      .isString()
      .withMessage("Tên phòng ban phải là chuỗi")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên phòng ban phải từ 2-100 ký tự"),
    body("managerId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("ID quản lý phải là số nguyên dương"),
  ],

  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID phòng ban không hợp lệ"),
  ],

  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID phòng ban không hợp lệ"),
  ],

  assignManager: [
    param("departmentId")
      .isInt({ min: 1 })
      .withMessage("ID phòng ban không hợp lệ"),
    param("employeeId")
      .isInt({ min: 1 })
      .withMessage("ID nhân viên không hợp lệ"),
  ],

  changeManager: [
    param("departmentId")
      .isInt({ min: 1 })
      .withMessage("ID phòng ban không hợp lệ"),
    param("newManagerId")
      .isInt({ min: 1 })
      .withMessage("ID quản lý mới không hợp lệ"),
  ],

  getManagers: [
    param("departmentId")
      .isInt({ min: 1 })
      .withMessage("ID phòng ban không hợp lệ"),
  ],
};
