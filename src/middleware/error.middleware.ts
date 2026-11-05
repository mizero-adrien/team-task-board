import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../utils/HttpError";

// Anything that matched no route
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, "NOT_FOUND", "Route not found"));
};

// The ONE place where errors become responses. It needs all 4 parameters,
// or Express does not recognise it as an error handler.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, code: err.code, ...err.details });
    return;
  }

  // express.json() throws a SyntaxError when the body is not valid JSON
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ message: "The request body is not valid JSON", code: "BAD_REQUEST" });
    return;
  }

  console.error(err);
  res.status(500).json({ message: "Something went wrong", code: "SERVER_ERROR" });
};