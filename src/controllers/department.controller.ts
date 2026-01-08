import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../config/db.js";

export const departmentController = {
  // Lấy danh sách tất cả phòng ban
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build filter conditions
      const where: any = {};

      if (search) {
        where.name = { contains: String(search), mode: "insensitive" };
      }

      // Get departments with pagination
      const [departments, total] = await Promise.all([
        prisma.department.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
          include: {
            manager: {
              select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            _count: {
              select: {
                employees: true,
                positions: true,
              },
            },
          },
        }),
        prisma.department.count({ where }),
      ]);

      return res.json({
        message: "Lấy danh sách phòng ban thành công",
        data: departments,
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

  // Lấy thông tin chi tiết của một phòng ban
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const department = await prisma.department.findUnique({
        where: { id: Number(id) },
        include: {
          manager: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          employees: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              position: {
                select: {
                  id: true,
                  name: true,
                },
              },
              status: true,
            },
            orderBy: { createdAt: "desc" },
          },
          positions: {
            select: {
              id: true,
              name: true,
              _count: {
                select: {
                  employees: true,
                },
              },
            },
            orderBy: { name: "asc" },
          },
        },
      });

      if (!department) {
        return res.status(404).json({ message: "Không tìm thấy phòng ban" });
      }

      return res.json({
        message: "Lấy thông tin phòng ban thành công",
        data: department,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Tạo phòng ban mới
  async create(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, managerId } = req.body;

      // Check if department name already exists
      const existingDepartment = await prisma.department.findUnique({
        where: { name: String(name) },
      });

      if (existingDepartment) {
        return res.status(400).json({ message: "Tên phòng ban đã tồn tại" });
      }

      // Check if manager exists and is not already a manager of another department
      if (managerId) {
        const manager = await prisma.employee.findUnique({
          where: { id: Number(managerId) },
          include: {
            managedDepartment: true,
          },
        });

        if (!manager) {
          return res.status(404).json({ message: "Không tìm thấy nhân viên quản lý" });
        }

        if (manager.managedDepartment) {
          return res.status(400).json({ message: "Nhân viên này đã là quản lý của một phòng ban khác" });
        }
      }

      const department = await prisma.department.create({
        data: {
          name: String(name),
          managerId: managerId ? Number(managerId) : null,
        },
        include: {
          manager: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Tạo phòng ban thành công",
        data: department,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Cập nhật thông tin phòng ban
  async update(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, managerId } = req.body;

      // Check if department exists
      const existingDepartment = await prisma.department.findUnique({
        where: { id: Number(id) },
      });

      if (!existingDepartment) {
        return res.status(404).json({ message: "Không tìm thấy phòng ban" });
      }

      // Check if new name already exists (if name is being updated)
      if (name && name !== existingDepartment.name) {
        const duplicateDepartment = await prisma.department.findUnique({
          where: { name: String(name) },
        });

        if (duplicateDepartment) {
          return res.status(400).json({ message: "Tên phòng ban đã tồn tại" });
        }
      }

      // Check if new manager exists and is not already a manager of another department
      if (managerId !== undefined && managerId !== existingDepartment.managerId) {
        if (managerId) {
          const manager = await prisma.employee.findUnique({
            where: { id: Number(managerId) },
            include: {
              managedDepartment: true,
            },
          });

          if (!manager) {
            return res.status(404).json({ message: "Không tìm thấy nhân viên quản lý" });
          }

          if (manager.managedDepartment && manager.managedDepartment.id !== Number(id)) {
            return res.status(400).json({ message: "Nhân viên này đã là quản lý của một phòng ban khác" });
          }
        }
      }

      const department = await prisma.department.update({
        where: { id: Number(id) },
        data: {
          ...(name && { name }),
          ...(managerId !== undefined && { managerId: managerId ? Number(managerId) : null }),
        },
        include: {
          manager: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return res.json({
        message: "Cập nhật phòng ban thành công",
        data: department,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Xóa phòng ban
  async delete(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      // Check if department exists
      const existingDepartment = await prisma.department.findUnique({
        where: { id: Number(id) },
        include: {
          _count: {
            select: {
              employees: true,
              positions: true,
            },
          },
        },
      });

      if (!existingDepartment) {
        return res.status(404).json({ message: "Không tìm thấy phòng ban" });
      }

      // Check if department has employees
      if (existingDepartment._count.employees > 0) {
        return res.status(400).json({
          message: "Không thể xóa phòng ban này vì vẫn còn nhân viên",
        });
      }

      // Check if department has positions
      if (existingDepartment._count.positions > 0) {
        return res.status(400).json({
          message: "Không thể xóa phòng ban này vì vẫn còn vị trí công việc",
        });
      }

      await prisma.department.delete({
        where: { id: Number(id) },
      });

      return res.json({
        message: "Xóa phòng ban thành công",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },
};
