import jwt from "jsonwebtoken";

const MIN_SECRET_LENGTH = 32;

function getSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be set and at least ${MIN_SECRET_LENGTH} characters long`);
  }

  return secret;
}

// The token holds ONLY the user id. The role and the blocked flag are read from the
// database on every request, so changing them takes effect immediately.
export function signToken(userId: string): string {
  return jwt.sign({ id: userId }, getSecret(), { algorithm: "HS256", expiresIn: "7d" });
}

export type TokenPayload = { id: string; iat: number };

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getSecret(), { algorithms: ["HS256"] });

  if (
    typeof decoded === "string" ||
    typeof decoded.id !== "string" ||
    typeof decoded.iat !== "number"
  ) {
    throw new jwt.JsonWebTokenError("Malformed token");
  }

  return { id: decoded.id, iat: decoded.iat };
}

// True for a bad, expired or tampered token. A missing JWT_SECRET is NOT one of these:
// that is a server mistake and must not look like a user mistake.
export const isInvalidTokenError = (error: unknown): boolean =>
  error instanceof jwt.JsonWebTokenError;