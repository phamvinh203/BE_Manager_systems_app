import type { Request, Response } from "express";
import { validationResult } from "express-validator";
import { prisma } from "../config/db.js";
import { sendMail } from "../helpers/sendMail.js";
import { generateRandomPassword, hashPassword } from "../utils/password.js";

export const employeeController = {
  // Lấy danh sách tất cả nhân viên
  async getAll(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        search, 
        status, 
        department 
      } = req.query;

      const pageNum = Number(page);
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      // Build filter conditions
      const where: any = {};

      if (search) {
        where.OR = [
          { code: { contains: String(search), mode: "insensitive" } },
          { firstName: { contains: String(search), mode: "insensitive" } },
          { lastName: { contains: String(search), mode: "insensitive" } },
          { email: { contains: String(search), mode: "insensitive" } },
        ];
      }

      if (status) {
        where.status = String(status);
      }

      if (department) {
        where.department = { contains: String(department), mode: "insensitive" };
      }

      // Get employees with pagination
      const [employees, total] = await Promise.all([
        prisma.employee.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.employee.count({ where }),
      ]);

      return res.json({
        message: "Lấy danh sách nhân viên thành công",
        data: employees,
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


  // Lấy thông tin nhân viên theo userId (dùng cho employee login)
  async getEmployeeByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      const employee = await prisma.employee.findFirst({
        where: { userId: Number(userId) },
      });

      if (!employee) {
        return res.status(404).json({ message: "Không tìm thấy thông tin nhân viên" });
      }

      return res.json({
        message: "Lấy thông tin nhân viên thành công",
        data: employee,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Tạo nhân viên mới
  async create(req: Request, res: Response) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      code,
      firstName,
      lastName,
      email,
      phone,
      position,
      department,
      salary,
      status,
      hiredAt,
    } = req.body;

    // Check if employee code already exists
    const existingCode = await prisma.employee.findUnique({
      where: { code },
    });

    if (existingCode) {
      return res.status(400).json({ message: "Mã nhân viên đã tồn tại" });
    }

    // Check if email already exists in Employee OR User table
    if (email) {
      const [existingEmployeeEmail, existingUserEmail] = await Promise.all([
        prisma.employee.findUnique({ where: { email } }),
        prisma.user.findUnique({ where: { email } }),
      ]);

      if (existingEmployeeEmail || existingUserEmail) {
        return res.status(400).json({ message: "Email đã tồn tại" });
      }
    }

    // Use transaction to create Employee + User together
    const result = await prisma.$transaction(async (tx) => {
      let userId: number | null = null;
      let rawPassword: string | null = null;

      // If email provided, create User account
      if (email) {
        rawPassword = generateRandomPassword(12);
        const hashedPassword = await hashPassword(rawPassword);

        const user = await tx.user.create({
          data: {
            email,
            fullName: `${firstName} ${lastName}`,
            password: hashedPassword,
            role: "EMPLOYEE",
            isActive: true,
          },
        });

        userId = user.id;
      }

      // Create Employee
      const employee = await tx.employee.create({
        data: {
          code,
          firstName,
          lastName,
          email,
          phone,
          position,
          department,
          salary: salary ? Number(salary) : null,
          status: status || "ACTIVE",
          hiredAt: new Date(hiredAt),
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return { employee, rawPassword };
    });

    // Send welcome email (outside transaction)
    if (email && result.rawPassword) {
      try {
        await sendMail({
          to: email,
          fullName: `${firstName} ${lastName}`,
          password: result.rawPassword,
        });
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError);
        // Don't fail the request, employee is already created
      }
    }

    return res.status(201).json({
      message: email 
        ? "Tạo nhân viên thành công. Email đăng nhập đã được gửi." 
        : "Tạo nhân viên thành công",
      data: result.employee,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Lỗi server" });
  }
  },

  // Cập nhật thông tin nhân viên
  async update(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const {
        code,
        firstName,
        lastName,
        email,
        phone,
        position,
        department,
        salary,
        status,
        hiredAt,
      } = req.body;

      // Check if employee exists
      const existingEmployee = await prisma.employee.findUnique({
        where: { id: Number(id) },
      });

      if (!existingEmployee) {
        return res.status(404).json({ message: "Không tìm thấy nhân viên" });
      }

      // Check if new code already exists (if code is being updated)
      if (code && code !== existingEmployee.code) {
        const existingCode = await prisma.employee.findUnique({
          where: { code },
        });

        if (existingCode) {
          return res.status(400).json({ message: "Mã nhân viên đã tồn tại" });
        }
      }

      // Check if new email already exists (if email is being updated)
      if (email && email !== existingEmployee.email) {
        const existingEmail = await prisma.employee.findUnique({
          where: { email },
        });

        if (existingEmail) {
          return res.status(400).json({ message: "Email đã tồn tại" });
        }
      }

      const employee = await prisma.employee.update({
        where: { id: Number(id) },
        data: {
          ...(code && { code }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(email !== undefined && { email }),
          ...(phone !== undefined && { phone }),
          ...(position !== undefined && { position }),
          ...(department !== undefined && { department }),
          ...(salary !== undefined && { salary: salary ? Number(salary) : null }),
          ...(status && { status }),
          ...(hiredAt && { hiredAt: new Date(hiredAt) }),
        },
      });

      return res.json({
        message: "Cập nhật nhân viên thành công",
        data: employee,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },

  // Xóa nhân viên
  async delete(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;

      // Check if employee exists
      const existingEmployee = await prisma.employee.findUnique({
        where: { id: Number(id) },
      });

      if (!existingEmployee) {
        return res.status(404).json({ message: "Không tìm thấy nhân viên" });
      }

      await prisma.employee.delete({
        where: { id: Number(id) },
      });

      return res.json({
        message: "Xóa nhân viên thành công",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  },
};
