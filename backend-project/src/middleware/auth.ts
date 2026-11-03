import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User";
import { ApiError } from "../utils/ApiError";
import { verifyAuthToken, type AuthTokenPayload } from "../utils/jwt";

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    next(ApiError.unauthorized());
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  let payload: AuthTokenPayload;

  try {
    payload = verifyAuthToken(token);
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
    return;
  }

  try {
    const user = await User.findById(payload.sub);

    if (!user) {
      next(ApiError.unauthorized("User no longer exists"));
      return;
    }

    if (user.isBlocked) {
      next(ApiError.forbidden("Your account has been blocked"));
      return;
    }

    req.user = { id: user._id.toString(), role: user.role };
    next();
  } catch (error) {
    next(error);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    next(ApiError.forbidden("Admin access required"));
    return;
  }

  next();
}
