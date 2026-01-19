import { body, param, query } from "express-validator";

export const taskValidator = {
  // ============== TASK VALIDATORS ==============

  // Tạo task mới
  createTask: [
    body("title")
      .notEmpty()
      .withMessage("Tiêu đề không được để trống")
      .isString()
      .withMessage("Tiêu đề phải là chuỗi")
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Tiêu đề phải từ 1-255 ký tự"),
    body("description")
      .optional()
      .isString()
      .withMessage("Mô tả phải là chuỗi")
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Mô tả không được quá 2000 ký tự"),
    body("departmentId")
      .notEmpty()
      .withMessage("ID phòng ban không được để trống")
      .isInt({ min: 1 })
      .withMessage("ID phòng ban không hợp lệ"),
    body("priority")
      .optional()
      .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
      .withMessage("Độ ưu tiên phải là LOW, MEDIUM, HIGH hoặc URGENT"),
    body("type")
      .optional()
      .isIn(["GENERAL", "REPORT", "TRAINING", "MEETING", "SYSTEM"])
      .withMessage("Loại task phải là GENERAL, REPORT, TRAINING, MEETING hoặc SYSTEM"),
    body("startDate")
      .optional()
      .isISO8601()
      .withMessage("Ngày bắt đầu không hợp lệ"),
    body("dueDate")
      .optional()
      .isISO8601()
      .withMessage("Ngày hết hạn không hợp lệ")
      .custom((dueDate, { req }) => {
        if (req.body.startDate && dueDate) {
          const start = new Date(req.body.startDate);
          const end = new Date(dueDate);
          if (end < start) {
            throw new Error("Ngày hết hạn phải sau ngày bắt đầu");
          }
        }
        return true;
      }),
  ],

  // Cập nhật task
  updateTask: [
    param("taskId")
      .isInt({ min: 1 })
      .withMessage("ID task không hợp lệ"),
    body("title")
      .optional()
      .isString()
      .withMessage("Tiêu đề phải là chuỗi")
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage("Tiêu đề phải từ 1-255 ký tự"),
    body("description")
      .optional()
      .isString()
      .withMessage("Mô tả phải là chuỗi")
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Mô tả không được quá 2000 ký tự"),
    body("priority")
      .optional()
      .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
      .withMessage("Độ ưu tiên phải là LOW, MEDIUM, HIGH hoặc URGENT"),
    body("type")
      .optional()
      .isIn(["GENERAL", "REPORT", "TRAINING", "MEETING", "SYSTEM"])
      .withMessage("Loại task phải là GENERAL, REPORT, TRAINING, MEETING hoặc SYSTEM"),
    body("startDate")
      .optional()
      .isISO8601()
      .withMessage("Ngày bắt đầu không hợp lệ"),
    body("dueDate")
      .optional()
      .isISO8601()
      .withMessage("Ngày hết hạn không hợp lệ"),
  ],

  // Lấy task theo ID
  getTaskById: [
    param("taskId")
      .isInt({ min: 1 })
      .withMessage("ID task không hợp lệ"),
  ],

  // Xóa task
  deleteTask: [
    param("taskId")
      .isInt({ min: 1 })
      .withMessage("ID task không hợp lệ"),
  ],

  // Query danh sách task
  getTasks: [
    query("departmentId")
      .optional()
      .isInt({ min: 1 })
      .withMessage("ID phòng ban không hợp lệ"),
    query("status")
      .optional()
      .isIn(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"])
      .withMessage("Trạng thái không hợp lệ"),
    query("priority")
      .optional()
      .isIn(["LOW", "MEDIUM", "HIGH", "URGENT"])
      .withMessage("Độ ưu tiên không hợp lệ"),
    query("type")
      .optional()
      .isIn(["GENERAL", "REPORT", "TRAINING", "MEETING", "SYSTEM"])
      .withMessage("Loại task không hợp lệ"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Trang phải là số nguyên dương"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit phải từ 1-100"),
  ],

  // ============== ASSIGNMENT VALIDATORS ==============

  // Gán task cho nhân viên
  assignTask: [
    param("taskId")
      .isInt({ min: 1 })
      .withMessage("ID task không hợp lệ"),
    body("employeeIds")
      .notEmpty()
      .withMessage("Danh sách nhân viên không được để trống")
      .isArray({ min: 1, max: 50 })
      .withMessage("Phải có từ 1-50 nhân viên"),
    body("employeeIds.*")
      .isInt({ min: 1 })
      .withMessage("ID nhân viên không hợp lệ"),
  ],

  // Bỏ gán task
  unassignTask: [
    param("taskId")
      .isInt({ min: 1 })
      .withMessage("ID task không hợp lệ"),
    param("employeeId")
      .isInt({ min: 1 })
      .withMessage("ID nhân viên không hợp lệ"),
  ],

  // Lấy danh sách assignee
  getAssignees: [
    param("taskId")
      .isInt({ min: 1 })
      .withMessage("ID task không hợp lệ"),
  ],

  // ============== MY TASKS VALIDATORS ==============

  // Query my tasks
  getMyTasks: [
    query("status")
      .optional()
      .isIn(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"])
      .withMessage("Trạng thái không hợp lệ"),
    query("page")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Trang phải là số nguyên dương"),
    query("limit")
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage("Limit phải từ 1-100"),
  ],

  // Lấy chi tiết assignment
  getMyTaskDetail: [
    param("assignmentId")
      .isInt({ min: 1 })
      .withMessage("ID assignment không hợp lệ"),
  ],

  // Cập nhật assignment
  updateAssignment: [
    param("assignmentId")
      .isInt({ min: 1 })
      .withMessage("ID assignment không hợp lệ"),
    body("status")
      .optional()
      .isIn(["TODO", "IN_PROGRESS", "REVIEW", "DONE", "CANCELLED"])
      .withMessage("Trạng thái không hợp lệ"),
    body("progress")
      .optional()
      .isInt({ min: 0, max: 100 })
      .withMessage("Tiến độ phải từ 0-100"),
  ],

  // Hoàn thành assignment
  completeAssignment: [
    param("assignmentId")
      .isInt({ min: 1 })
      .withMessage("ID assignment không hợp lệ"),
  ],

  // lấy task của phòng ban
  getTasksByDepartment: [
    param("departmentId")
      .isInt({ min: 1 })
      .withMessage("ID phòng ban không hợp lệ"),
  ],

  // ============== REVIEW & APPROVAL VALIDATORS ==============

  // Review task
  reviewTask: [
    param("taskId")
      .isInt({ min: 1 })
      .withMessage("ID task không hợp lệ"),
  ],

  // Approve task
  approveTask: [
    param("taskId")
      .isInt({ min: 1 })
      .withMessage("ID task không hợp lệ"),
  ],

  // ============== DASHBOARD & PROGRESS VALIDATORS ==============

  // Dashboard phòng ban
  getDepartmentDashboard: [
    param("departmentId")
      .isInt({ min: 1 })
      .withMessage("ID phòng ban không hợp lệ"),
  ],

  // Tiến độ task
  getTaskProgress: [
    param("taskId")
      .isInt({ min: 1 })
      .withMessage("ID task không hợp lệ"),
  ],

  // Lịch sử task
  getTaskLogs: [
    param("taskId")
      .isInt({ min: 1 })
      .withMessage("ID task không hợp lệ"),
  ],
};