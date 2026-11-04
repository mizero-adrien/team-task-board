import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { ApiError } from "../utils/ApiError";

interface ValidationSchemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);

      if (!result.success) {
        next(ApiError.badRequest("Invalid request body", result.error.flatten()));
        return;
      }

      req.body = result.data;
    }

    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);

      if (!result.success) {
        next(ApiError.badRequest("Invalid request parameters", result.error.flatten()));
        return;
      }

      req.params = result.data as Request["params"];
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);

      if (!result.success) {
        next(ApiError.badRequest("Invalid query parameters", result.error.flatten()));
        return;
      }

      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
      });
    }

    next();
  };
}
