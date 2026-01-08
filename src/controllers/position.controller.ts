import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../config/db.js";

export const positionController = {
  // Lấy danh sách tất cả vị trí công việc
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10, search, department } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build filter conditions
      const where: any = {};

      if (search) {
        where.name = { contains: String(search), mode: "insensitive" };
      }

      if (department) {
        where.departmentId = Number(department);
      }

      // Get positions with pagination
      const [positions, total] = await Promise.all([
        prisma.position.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
          include: {
            department: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                employees: true,
              },
            },
          },
        }),
        prisma.position.count({ where }),
      ]);

      return res.json({
        message: "Lấy danh sách vị trí công việc thành công",
        data: positions,
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

  // Lấy thông tin chi tiết của một vị trí công việc
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const position = await prisma.position.findUnique({
        where: { id: Number(id) },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          employees: {
            select: {
              id: true,
              code: true,
              firstName: true,
              lastName: true,
              email: true,
              status: true,
            },
          },
        },
      });

      if (!position) {
        return res.status(404).json({ message: "Không tìm thấy vị trí công việc" });
      }

      return res.json({
        message: "Lấy thông tin vị trí công việc thành công",
        data: position,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Tạo vị trí công việc mới
  async create(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, departmentId } = req.body;

      // Check if department exists
      const department = await prisma.department.findUnique({
        where: { id: Number(departmentId) },
      });

      if (!department) {
        return res.status(404).json({ message: "Không tìm thấy phòng ban" });
      }

      // Check if position name already exists in the same department
      const existingPosition = await prisma.position.findUnique({
        where: {
          name_departmentId: {
            name: String(name),
            departmentId: Number(departmentId),
          },
        },
      });

      if (existingPosition) {
        return res.status(400).json({ message: "Vị trí công việc đã tồn tại trong phòng ban này" });
      }

      const position = await prisma.position.create({
        data: {
          name: String(name),
          departmentId: Number(departmentId),
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Tạo vị trí công việc thành công",
        data: position,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Cập nhật thông tin vị trí công việc
  async update(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { name, departmentId } = req.body;

      // Check if position exists
      const existingPosition = await prisma.position.findUnique({
        where: { id: Number(id) },
      });

      if (!existingPosition) {
        return res.status(404).json({ message: "Không tìm thấy vị trí công việc" });
      }

      // Check if department exists
      if (departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: Number(departmentId) },
        });

        if (!department) {
          return res.status(404).json({ message: "Không tìm thấy phòng ban" });
        }
      }

      // Check if position name already exists in the same department (if name or department is being updated)
      const newDepartmentId = departmentId ? Number(departmentId) : existingPosition.departmentId;
      const newName = name || existingPosition.name;

      const duplicatePosition = await prisma.position.findUnique({
        where: {
          name_departmentId: {
            name: String(newName),
            departmentId: newDepartmentId,
          },
        },
      });

      if (duplicatePosition && duplicatePosition.id !== Number(id)) {
        return res.status(400).json({ message: "Vị trí công việc đã tồn tại trong phòng ban này" });
      }

      const position = await prisma.position.update({
        where: { id: Number(id) },
        data: {
          ...(name && { name }),
          ...(departmentId && { departmentId: Number(departmentId) }),
        },
        include: {
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return res.json({
        message: "Cập nhật vị trí công việc thành công",
        data: position,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Xóa vị trí công việc
  async delete(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      // Check if position exists
      const existingPosition = await prisma.position.findUnique({
        where: { id: Number(id) },
        include: {
          _count: {
            select: {
              employees: true,
            },
          },
        },
      });

      if (!existingPosition) {
        return res.status(404).json({ message: "Không tìm thấy vị trí công việc" });
      }

      // Check if position has employees
      if (existingPosition._count.employees > 0) {
        return res.status(400).json({
          message: "Không thể xóa vị trí công việc này vì vẫn còn nhân viên đang giữ vị trí",
        });
      }

      await prisma.position.delete({
        where: { id: Number(id) },
      });

      return res.json({
        message: "Xóa vị trí công việc thành công",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },
};
