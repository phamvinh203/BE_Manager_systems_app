import { PrismaClient, Role } from "@prisma/client";
import * as bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...\n");

  // ============================================
  // 1. TẠO DEPARTMENT VÀ POSITIONS
  // ============================================
  console.log("📦 Creating departments...");

  const itDepartment = await prisma.department.upsert({
    where: { name: "Phòng IT" },
    update: {},
    create: { name: "Phòng IT" },
  });
  console.log(`Department created: ${itDepartment.name}`);

  const hrDepartment = await prisma.department.upsert({
    where: { name: "Phòng Nhân sự" },
    update: {},
    create: { name: "Phòng Nhân sự" },
  });
  console.log(`Department created: ${hrDepartment.name}`);

  console.log("\n📦 Creating positions...");

  const itPositions = [
    "Trưởng Phòng IT",
    "Tech Lead",
    "Senior Developer",
    "Middle Developer",
    "Junior Developer",
    "Fresher Developer",
    "QA Engineer",
    "DevOps Engineer",
    "Business Analyst",
    "UI/UX Designer",
    "System Administrator",
    "Database Administrator",
    "Technical Support",
  ];

  for (const posName of itPositions) {
    const position = await prisma.position.upsert({
      where: {
        name_departmentId: {
          name: posName,
          departmentId: itDepartment.id,
        },
      },
      update: {},
      create: {
        name: posName,
        departmentId: itDepartment.id,
      },
    });
  }

  const hrPositions = [
    "Trưởng Phòng Nhân sự",
    "HR Manager",
    "HR Specialist",
    "Recruiter",
  ];

  for (const posName of hrPositions) {
    const position = await prisma.position.upsert({
      where: {
        name_departmentId: {
          name: posName,
          departmentId: hrDepartment.id,
        },
      },
      update: {},
      create: {
        name: posName,
        departmentId: hrDepartment.id,
      },
    });
  }

  // ============================================
  // 2. TẠO USERS VÀ EMPLOYEES (ADMIN & HR)
  // ============================================
  console.log("\n📦 Creating users and employees...");

  const hashedPassword = await bcryptjs.hash("123456", 10);

  // Lấy positions cho admin và hr
  const adminPosition = await prisma.position.findFirst({
    where: {
      name: "System Administrator",
      departmentId: itDepartment.id,
    },
  });

  const hrManagerPosition = await prisma.position.findFirst({
    where: {
      name: "HR Manager",
      departmentId: hrDepartment.id,
    },
  });

  // Tạo User và Employee cho Admin
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      fullName: "System Administrator",
      password: hashedPassword,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`Admin user created: ${adminUser.email}`);

  await prisma.employee.upsert({
    where: { code: "ADMIN001" },
    update: {},
    create: {
      code: "ADMIN001",
      firstName: "System",
      lastName: "Administrator",
      email: "admin@company.com",
      phone: "0901234567",
      salary: 30000000,
      status: "ACTIVE",
      hiredAt: new Date(),
      departmentId: itDepartment.id,
      positionId: adminPosition?.id,
      userId: adminUser.id,
    },
  });
  console.log(`Admin employee created: ADMIN001`);

  // Tạo User và Employee cho HR
  const hrUser = await prisma.user.upsert({
    where: { email: "hr@company.com" },
    update: {},
    create: {
      email: "hr@company.com",
      fullName: "HR Manager",
      password: hashedPassword,
      role: Role.HR,
      isActive: true,
    },
  });
  console.log(`HR user created: ${hrUser.email}`);

  await prisma.employee.upsert({
    where: { code: "HR001" },
    update: {},
    create: {
      code: "HR001",
      firstName: "HR",
      lastName: "Manager",
      email: "hr@company.com",
      phone: "0901234568",
      salary: 25000000,
      status: "ACTIVE",
      hiredAt: new Date(),
      departmentId: hrDepartment.id,
      positionId: hrManagerPosition?.id,
      userId: hrUser.id,
    },
  });
  console.log(`HR employee created: HR001`);

  console.log("\n✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });