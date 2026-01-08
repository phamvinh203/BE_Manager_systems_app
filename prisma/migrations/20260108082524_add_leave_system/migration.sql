-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'SICK', 'UNPAID', 'WFH', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "leave_requests" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "from_date" TIMESTAMP(3) NOT NULL,
    "to_date" TIMESTAMP(3) NOT NULL,
    "total_days" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "approver_id" INTEGER,
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejectNote" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" SERIAL NOT NULL,
    "employee_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "totalDays" DOUBLE PRECISION NOT NULL,
    "usedDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pendingDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_requests_employee_id_idx" ON "leave_requests"("employee_id");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "leave_requests"("status");

-- CreateIndex
CREATE INDEX "leave_balances_employee_id_idx" ON "leave_balances"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_employee_id_year_leaveType_key" ON "leave_balances"("employee_id", "year", "leaveType");

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
