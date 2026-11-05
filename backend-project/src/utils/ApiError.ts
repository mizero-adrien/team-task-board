import { HttpError, type ErrorCode } from "./HttpError";

export class ApiError extends HttpError {
  readonly statusCode: number;

  constructor(statusCode: number, message: string, code: string, details?: unknown) {
    super(
      statusCode,
      code as ErrorCode,
      message,
      details && typeof details === "object" ? (details as Record<string, unknown>) : {},
    );
    this.name = "ApiError";
    this.statusCode = statusCode;
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, "VALIDATION_FAILED", details);
  }

  static unauthorized(message = "Authentication required"): ApiError {
    return new ApiError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "You do not have permission to perform this action"): ApiError {
    return new ApiError(403, message, "FORBIDDEN");
  }

  static notFound(message = "The requested resource was not found"): ApiError {
    return new ApiError(404, message, "NOT_FOUND");
  }

  static conflict(message: string, details?: unknown): ApiError {
    return new ApiError(409, message, "CONFLICT", details);
  }

  static gone(message: string): ApiError {
    return new ApiError(410, message, "INVITE_INVALID");
  }
}
