import { Router } from "express";
import authRoutes from "./auth.route.js";
import employeeRoutes from "./employee.route.js";
import attendanceRoutes from "./attendance.route.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);

router.use("/attendance", attendanceRoutes);

export default router;
