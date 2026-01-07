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
          errors: validation.error.errors,
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
          role: role || "USER",
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
          errors: validation.error.errors,
        });
      }

      const { email, password } = validation.data;

      // 1. Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return res.status(400).json({
          message: "Invalid email or password",
        });
      }

      // 2. Compare password
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
        },
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  },
};
