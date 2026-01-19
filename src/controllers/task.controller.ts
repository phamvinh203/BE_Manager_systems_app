import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import { TaskService } from "../services/task.service.js";
import { prisma } from "../config/db.js";

export const taskController = {
  // ============== TASK CRUD CONTROLLERS ==============

  // Tạo task mới
  async createTask(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Lấy employeeId từ user
      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const task = await TaskService.createTask(employee.id, req.body);

      return res.status(201).json({
        message: "Tạo task thành công",
        data: task,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Lấy danh sách task
  async getTasks(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await TaskService.getTasks(req.query);

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Lấy chi tiết task
  async getTaskById(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const task = await TaskService.getTaskById(
        Number(req.params.taskId),
        req.user!.userId,
        req.user!.role
      );

      return res.json({ data: task });
    } catch (error: any) {
      console.error(error);
      return res.status(404).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Cập nhật task
  async updateTask(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const task = await TaskService.updateTask(
        Number(req.params.taskId),
        employee.id,
        req.body
      );

      return res.json({
        message: "Cập nhật task thành công",
        data: task,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Xóa task
  async deleteTask(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const task = await TaskService.deleteTask(
        Number(req.params.taskId),
        employee.id
      );

      return res.json({
        message: "Xóa task thành công",
        data: task,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // ============== ASSIGNMENT CONTROLLERS ==============

  // Gán task cho nhân viên
  async assignTask(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await TaskService.assignTask(
        Number(req.params.taskId),
        employee.id,
        req.body.employeeIds
      );

      return res.json({
        message: "Gán task thành công",
        data: result,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Bỏ gán task
  async unassignTask(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await TaskService.unassignTask(
        Number(req.params.taskId),
        employee.id,
        Number(req.params.employeeId)
      );

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Lấy danh sách nhân viên được gán task
  async getTaskAssignees(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await TaskService.getTaskAssignees(Number(req.params.taskId));

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(404).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // lấy task của phòng ban
  async getTasksByDepartment(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      } 
      const result = await TaskService.getTasksByDepartment(
        Number(req.params.departmentId),
        req.query
      );
      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // ============== MY TASKS CONTROLLERS ==============

  // Lấy danh sách task của tôi
  async getMyTasks(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await TaskService.getMyTasks(employee.id, req.query);

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Lấy chi tiết assignment của tôi
  async getMyTaskDetail(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await TaskService.getMyTaskDetail(
        Number(req.params.assignmentId),
        employee.id
      );

      return res.json({ data: result });
    } catch (error: any) {
      console.error(error);
      return res.status(404).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Cập nhật assignment
  async updateAssignment(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await TaskService.updateAssignment(
        Number(req.params.assignmentId),
        employee.id,
        req.body
      );

      return res.json({
        message: "Cập nhật tiến độ thành công",
        data: result,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Hoàn thành assignment
  async completeAssignment(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await TaskService.completeAssignment(
        Number(req.params.assignmentId),
        employee.id
      );

      return res.json({
        message: "Đã hoàn thành task",
        data: result,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // ============== REVIEW & APPROVAL CONTROLLERS ==============

  // Chuyển task sang review
  async setTaskReview(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await TaskService.setTaskReview(
        Number(req.params.taskId),
        employee.id
      );

      return res.json({
        message: "Đã chuyển task sang trạng thái review",
        data: result,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Phê duyệt task
  async approveTask(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await TaskService.approveTask(
        Number(req.params.taskId),
        employee.id
      );

      return res.json({
        message: "Đã phê duyệt task",
        data: result,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // ============== DASHBOARD & STATS CONTROLLERS ==============

  // Lấy thống kê task của phòng ban
  async getDepartmentDashboard(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await TaskService.getDepartmentDashboard(
        Number(req.params.departmentId)
      );

      return res.json({ data: result });
    } catch (error: any) {
      console.error(error);
      return res.status(404).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Lấy tiến độ task
  async getTaskProgress(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await TaskService.getTaskProgress(Number(req.params.taskId));

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(404).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Lấy lịch sử thay đổi task
  async getTaskLogs(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await TaskService.getTaskLogs(Number(req.params.taskId));

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(404).json({
        message: error.message || "Lỗi server",
      });
    }
  },
};