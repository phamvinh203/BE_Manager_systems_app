// src/controllers/attendance.controller.ts
import type { Request, Response } from "express";

import { prisma } from "../config/db.js";

export const attendanceController = {
  // POST /attendance/check-in
  async checkIn(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { time } = req.body; 

      // Lấy employee từ user
      const employee = await prisma.employee.findUnique({
        where: { userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      // Lấy ngày hôm nay (UTC 00:00)
      const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

      // Kiểm tra đã check-in hôm nay chưa
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: today,
          },
        },
      });

      if (existingAttendance) {
        return res.status(400).json({ message: "Bạn đã check-in hôm nay rồi" });
      }

      // Parse time "08:30" thành DateTime
      const [hours, minutes] = time.split(":").map(Number);
      const checkInTime = new Date(Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0
      ));

      const attendance = await prisma.attendance.create({
        data: {
          employeeId: employee.id,
          date: today,
          checkIn: checkInTime,
        },
      });

      return res.status(201).json({
        message: "Check-in thành công",
        data: attendance,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // POST /attendance/check-out
  async checkOut(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { time } = req.body; // "17:30"

      const employee = await prisma.employee.findUnique({
        where: { userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      // Lấy ngày hôm nay (UTC 00:00)
      const now = new Date();
      const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

      // Tìm attendance hôm nay
      const attendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: today,
          },
        },
      });

      if (!attendance) {
        return res.status(400).json({ message: "Bạn chưa check-in hôm nay" });
      }

      if (attendance.checkOut) {
        return res.status(400).json({ message: "Bạn đã check-out hôm nay rồi" });
      }

      // Parse time
      const [hours, minutes] = time.split(":").map(Number);
      const checkOutTime = new Date(Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hours,
        minutes,
        0,
        0
      ));

      // Tính totalHours
      const checkInTime = new Date(attendance.checkIn!);
      const diffMs = checkOutTime.getTime() - checkInTime.getTime();
      const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100; // Làm tròn 2 số

      if (totalHours < 0) {
        return res.status(400).json({ message: "Giờ check-out phải sau giờ check-in" });
      }

      const updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: checkOutTime,
          totalHours,
        },
      });

      return res.json({
        message: "Check-out thành công",
        data: updatedAttendance,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // GET /attendance/me - Nhân viên xem công của mình
  async getMyAttendance(req: Request, res: Response) {
    try {
      const userId = req.user!.userId;
      const { month, year } = req.query;

      const employee = await prisma.employee.findUnique({
        where: { userId },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      // Filter theo tháng/năm nếu có
      const where: any = { employeeId: employee.id };

      if (month && year) {
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0); // Ngày cuối tháng

        where.date = {
          gte: startDate,
          lte: endDate,
        };
      }

      const attendances = await prisma.attendance.findMany({
        where,
        orderBy: { date: "desc" },
      });

      // Tính tổng giờ làm
      const totalWorkedHours = attendances.reduce(
        (sum, att) => sum + (att.totalHours || 0),
        0
      );

      return res.json({
        message: "Lấy dữ liệu chấm công thành công",
        data: {
          attendances,
          summary: {
            totalDays: attendances.length,
            totalWorkedHours: Math.round(totalWorkedHours * 100) / 100,
          },
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // GET /attendance - HR/Admin xem toàn bộ
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, employeeId, month, year, date } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (employeeId) {
        where.employeeId = Number(employeeId);
      }

      if (date) {
        where.date = new Date(String(date));
      } else if (month && year) {
        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0);

        where.date = {
          gte: startDate,
          lte: endDate,
        };
      }

      const [attendances, total] = await Promise.all([
        prisma.attendance.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { date: "desc" },
          include: {
            employee: {
              select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
                department: true,
              },
            },
          },
        }),
        prisma.attendance.count({ where }),
      ]);

      return res.json({
        message: "Lấy dữ liệu chấm công thành công",
        data: attendances,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },
};