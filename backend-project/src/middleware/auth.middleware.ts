import type { RequestHandler } from "express";
import { User } from "../models/User";
import { HttpError } from "../utils/HttpError";
import { asyncHandler } from "../utils/asyncHandler";
import { isInvalidTokenError, verifyToken, type TokenPayload } from "../utils/token";

// Signed in? Runs before every protected route.
export const protect: RequestHandler = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "UNAUTHORIZED", "Please sign in to continue");
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(header.slice(7));
  } catch (error) {
    if (isInvalidTokenError(error)) {
      throw new HttpError(401, "UNAUTHORIZED", "Your session has expired. Please sign in again.");
    }
    throw error;
  }

  // The user is read from the database on EVERY request. That is what makes
  // blocking, password changes and role changes take effect immediately.
  const user = await User.findById(payload.id).select(
    "name email role blocked blockReason blockedAt passwordChangedAt"
  );

  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "This account no longer exists");
  }

  // iat is in whole seconds, so compare in seconds too
  if (
    user.passwordChangedAt &&
    Math.floor(user.passwordChangedAt.getTime() / 1000) > payload.iat
  ) {
    throw new HttpError(401, "UNAUTHORIZED", "Your password was changed. Please sign in again.");
  }

  if (user.blocked) {
    throw new HttpError(403, "ACCOUNT_BLOCKED", "Your account has been blocked", {
      reason: user.blockReason ?? null,
      blockedAt: user.blockedAt ?? null,
    });
  }

  req.user = { id: String(user._id), name: user.name, email: user.email, role: user.role };
  next();
});

// Use AFTER protect, on admin routes
export const adminOnly: RequestHandler = (req, _res, next) => {
  if (req.user?.role !== "admin") {
    return next(new HttpError(403, "FORBIDDEN", "Admin access required"));
  }
  next();
};