import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import { LeaveService } from "../services/leave.service.js";
import { prisma } from "../config/db.js";

export const leaveController = {
  // LEAVE REQUEST CONTROLLERS

  // Tạo đơn xin nghỉ/WFH
  async createRequest(req: Request, res: Response) {
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

      const leaveRequest = await LeaveService.createRequest(employee.id, req.body);

      return res.status(201).json({
        message: "Tạo đơn xin nghỉ thành công",
        data: leaveRequest,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Xem danh sách đơn của mình
  async getMyRequests(req: Request, res: Response) {
    try {
      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await LeaveService.getMyRequests(employee.id, req.query);

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Xem chi tiết một đơn
  async getRequestById(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const request = await LeaveService.getRequestById(
        Number(req.params.id),
        req.user!.userId,
        req.user!.role
      );

      return res.json({ data: request });
    } catch (error: any) {
      console.error(error);
      return res.status(404).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Hủy đơn (chỉ khi PENDING)
  async cancelRequest(req: Request, res: Response) {
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

      const request = await LeaveService.cancelRequest(Number(req.params.id), employee.id);

      return res.json({
        message: "Hủy đơn thành công",
        data: request,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Xem đơn của nhân viên cấp dưới (manager)
  async getTeamRequests(req: Request, res: Response) {
    try {
      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await LeaveService.getTeamRequests(employee.id, req.query);

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Duyệt đơn
  async approveRequest(req: Request, res: Response) {
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

      const request = await LeaveService.approveRequest(
        Number(req.params.id),
        employee.id
      );

      return res.json({
        message: "Duyệt đơn thành công",
        data: request,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Từ chối đơn
  async rejectRequest(req: Request, res: Response) {
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

      const { rejectNote } = req.body;
      const request = await LeaveService.rejectRequest(
        Number(req.params.id),
        employee.id,
        rejectNote
      );

      return res.json({
        message: "Đã từ chối đơn",
        data: request,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Xem tất cả đơn (có filter) - HR/Admin
  async getAllRequests(req: Request, res: Response) {
    try {
      const result = await LeaveService.getAllRequests(req.query);

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // LEAVE BALANCE CONTROLLERS

  // Xem số ngày phép của mình
  async getMyBalance(req: Request, res: Response) {
    try {
      const employee = await prisma.employee.findFirst({
        where: { userId: req.user!.userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      const result = await LeaveService.getMyBalance(
        employee.id,
        req.query.year ? Number(req.query.year) : undefined
      );

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Xem số ngày phép của 1 nhân viên - HR/Admin
  async getEmployeeBalance(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await LeaveService.getEmployeeBalance(
        Number(req.params.employeeId),
        req.query.year ? Number(req.query.year) : undefined
      );

      return res.json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(404).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Cập nhật số ngày phép - HR/Admin
  async updateBalance(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const balance = await LeaveService.updateBalance(
        Number(req.params.employeeId),
        req.body
      );

      return res.json({
        message: "Cập nhật số ngày phép thành công",
        data: balance,
      });
    } catch (error: any) {
      console.error(error);
      return res.status(400).json({
        message: error.message || "Lỗi server",
      });
    }
  },

  // Khởi tạo balance đầu năm cho tất cả nhân viên - Admin
  async initializeBalance(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { year } = req.body;
      const result = await LeaveService.initializeBalanceForAllEmployees(year);

      return res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        message: error.message || "Lỗi server",
      });
    }
  },
};
