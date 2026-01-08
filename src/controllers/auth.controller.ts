import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import { TokenManager } from "../utils/token_manager.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";

export const authController = {
  async register(req: Request, res: Response) {
    try {
      // Validate input
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validation.error,
        });
      }

      const { fullName, email, password, role } = validation.data;

      // 1. Check email exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Create user
      const user = await prisma.user.create({
        data: {
          email,
          fullName,
          password: hashedPassword,
          role: role || "EMPLOYEE",
        },
      });

      return res.status(201).json({
        message: "Register successful",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  },

  async login(req: Request, res: Response) {
    try {
      // Validate input
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: validation.error,
        });
      }

      const { email, password } = validation.data;

      // 1. Find user with employee info including department and position
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          employee: {
            include: {
              department: {
                select: {
                  id: true,
                  name: true,
                },
              },
              position: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!user) {
        return res.status(400).json({
          message: "Invalid email or password",
        });
      }

      // 2. Compare password

      if (!user.password) {
        return res.status(400).json({
          message: "Invalid email or password",
        });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          message: "Invalid email or password",
        });
      }

      // 3. Generate token
      const accessToken = TokenManager.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      return res.json({
        message: "Login successful",
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          employee: user.employee ? {
            code: user.employee.code,
            department: user.employee.department,
            position: user.employee.position,
          } : null,
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      // Token-based logout: tokens are stateless JWT, so we just return success
      // Client should remove the token from their storage
      // For PostgreSQL implementation, you could:
      // 1. Add a token blacklist table
      // 2. Store revoked tokens with expiration
      // 3. Check blacklist on each authenticated request
      // Currently using stateless JWT approach (recommended for scalability)

      return res.json({
        message: "Logout successful",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  }
};
