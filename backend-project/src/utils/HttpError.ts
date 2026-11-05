// The error codes from docs/api.md. Add new ones here, in a pull request.
export type ErrorCode =
  | "VALIDATION_FAILED"
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "ACCOUNT_BLOCKED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS"
  | "RESET_TOKEN_INVALID"
  | "CANNOT_REMOVE_OWNER"
  | "CANNOT_BLOCK_ADMIN"
  | "MEMBER_LIMIT"
  | "BOARD_LIMIT"
  | "LIST_LIMIT"
  | "LIST_NAME_TAKEN"
  | "LIST_NOT_EMPTY"
  | "LIST_NOT_ON_BOARD"
  | "CARD_LIMIT"
  | "COMMENT_LIMIT"
  | "ASSIGNEE_NOT_MEMBER"
  | "BATCH_ALREADY_ADDED"
  | "INVITE_INVALID"
  | "INVITE_EMAIL_MISMATCH"
  | "RATE_LIMITED"
  | "AI_LIMIT_REACHED"
  | "AI_INVALID_OUTPUT"
  | "AI_UNAVAILABLE"
  | "SERVER_ERROR";

export class HttpError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  // Extra fields that are sent to the client, such as { errors: [...] } or { reason: "..." }
  readonly details: Record<string, unknown>;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}