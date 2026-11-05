import type { Request } from "express";
import { HttpError } from "./HttpError";

export function requireUser(req: Request) {
  if (!req.user) throw new HttpError(401, "UNAUTHORIZED", "Please sign in to continue");
  return req.user;
}
