import jwt, { type SignOptions } from "jsonwebtoken";

export interface AuthTokenPayload {
  sub: string;
  role: "user" | "admin";
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not set. Add it to your .env file.");
  }

  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

  return jwt.sign(payload, getSecret(), { expiresIn });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, getSecret());

  if (typeof decoded === "string" || !decoded.sub || !decoded.role) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: String(decoded.sub),
    role: decoded.role === "admin" ? "admin" : "user",
  };
}
