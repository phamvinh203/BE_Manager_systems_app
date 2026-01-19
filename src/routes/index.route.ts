import { Router } from "express";
import authRoutes from "./auth.route.js";
import employeeRoutes from "./employee.route.js";
import attendanceRoutes from "./attendance.route.js";
import departmentRoutes from "./department.route.js";
import positionRoutes from "./position.route.js";
import leaveRoutes from "./leave.route.js";
import taskRoutes from "./task.route.js";
import myTaskRoutes from "./my-task.route.js";


const router = Router();

router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);
router.use("/departments", departmentRoutes);
router.use("/positions", positionRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/leave", leaveRoutes);
router.use("/tasks", taskRoutes);
router.use("/my-tasks", myTaskRoutes);



export default router;
