import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { HttpError } from "../utils/HttpError";

// Checks req.body against a Zod schema. On success, req.body is REPLACED by the
// parsed result, so unknown fields (like a "role" sent at sign-up) are dropped.
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      return next(
        new HttpError(400, "VALIDATION_FAILED", "Validation failed", {
          errors: result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        })
      );
    }

    req.body = result.data;
    next();
  };

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;

// Checks that a URL parameter such as :boardId is a valid 24-character id,
// so a bad id gives a clean 400 instead of a database error.
export const validateIdParam =
  (...names: string[]): RequestHandler =>
  (req, _res, next) => {
    const errors = names
      .filter((name) => {
        const value = req.params[name];
        return typeof value !== "string" || !OBJECT_ID.test(value);
      })
      .map((name) => ({ field: name, message: "Must be a valid ID" }));

    if (errors.length > 0) {
      return next(new HttpError(400, "VALIDATION_FAILED", "Validation failed", { errors }));
    }

    next();
  };