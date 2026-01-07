import { PrismaClient, Role } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcryptjs.hash("123456", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      fullName: "System Admin",
      password: passwordHash,
      role: Role.ADMIN,
      employee: {
        create: {
          code: "EMP-ADMIN",
          firstName: "Admin",
          lastName: "System",
          position: "Administrator",
          department: "IT",
          status: "ACTIVE",
          hiredAt: new Date(),
        },
      },
    },
  });

  const hrUser = await prisma.user.upsert({
    where: { email: "hr@company.com" },
    update: {},
    create: {
      email: "hr@company.com",
      fullName: "HR Manager",
      password: passwordHash,
      role: Role.HR,
      employee: {
        create: {
          code: "EMP-HR",
          firstName: "HR",
          lastName: "Manager",
          position: "HR Manager",
          department: "Human Resources",
          status: "ACTIVE",
          hiredAt: new Date(),
        },
      },
    },
  });

  console.log(" Seed data created:");
  console.log("ADMIN:", adminUser.email);
  console.log("HR:", hrUser.email);
}

main()
  .catch((e) => {
    console.error(" Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
