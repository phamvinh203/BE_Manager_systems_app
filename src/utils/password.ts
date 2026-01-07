import bcryptjs from "bcryptjs";
import crypto from "crypto";

export function generateRandomPassword(length: number = 12): string {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
}

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}