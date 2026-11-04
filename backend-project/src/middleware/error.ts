import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError";

interface MongoServerError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      details: Object.fromEntries(
        Object.entries(error.errors).map(([field, item]) => [field, item.message]),
      ),
    });
    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    res.status(400).json({
      message: `Invalid value for ${error.path}`,
      code: "CAST_ERROR",
    });
    return;
  }

  const mongoError = error as MongoServerError;

  if (mongoError.code === 11000) {
    res.status(409).json({
      message: "A record with this value already exists",
      code: "DUPLICATE_KEY",
      details: mongoError.keyValue,
    });
    return;
  }

  console.error("Unhandled request error:", error);
  res.status(500).json({
    message: "Something went wrong",
    code: "SERVER_ERROR",
  });
}
