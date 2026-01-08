import { body, param } from "express-validator";

export const positionValidator = {
  create: [
    body("name")
      .notEmpty()
      .withMessage("Tên vị trí không được để trống")
      .isString()
      .withMessage("Tên vị trí phải là chuỗi")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên vị trí phải từ 2-100 ký tự"),
    body("departmentId")
      .notEmpty()
      .withMessage("ID phòng ban không được để trống")
      .isInt({ min: 1 })
      .withMessage("ID phòng ban phải là số nguyên dương"),
  ],

  update: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID vị trí không hợp lệ"),
    body("name")
      .optional()
      .isString()
      .withMessage("Tên vị trí phải là chuỗi")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Tên vị trí phải từ 2-100 ký tự"),
    body("departmentId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("ID phòng ban phải là số nguyên dương"),
  ],

  getById: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID vị trí không hợp lệ"),
  ],

  delete: [
    param("id")
      .isInt({ min: 1 })
      .withMessage("ID vị trí không hợp lệ"),
  ],
};
