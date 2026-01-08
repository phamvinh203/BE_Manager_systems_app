import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const ACCESS_TOKEN_EXPIRES_IN = "15m";

export type UserRole = "ADMIN" | "HR" | "EMPLOYEE";

export interface TokenPayload {
  userId: number;
  email: string;
  role: UserRole;
}

export const TokenManager = {
  generateAccessToken(payload: TokenPayload) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
  },

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;
  },
};
