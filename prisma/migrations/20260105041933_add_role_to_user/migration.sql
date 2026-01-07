-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'HR', 'USER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
