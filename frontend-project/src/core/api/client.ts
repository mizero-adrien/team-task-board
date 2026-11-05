import axios from "axios";
import { AUTH_BLOCKED_EVENT, AUTH_TOKEN_KEY, AUTH_UNAUTHORIZED_EVENT } from "../constants";

export type FieldError = { field: string; message: string };

// The error body from docs/api.md: { message, code, errors?, ...extra }
type ErrorBody = Record<string, unknown>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: FieldError[];
  // Extra fields from the server, such as { reason } for a blocked account or { usage } for the AI limit
  readonly data: Record<string, unknown>;

  constructor(
    message: string,
    status = 0,
    code = "UNKNOWN",
    fieldErrors: FieldError[] = [],
    data: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.data = data;
  }
}

const isFieldError = (value: unknown): value is FieldError =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as FieldError).field === "string" &&
  typeof (value as FieldError).message === "string";

const toErrorBody = (data: unknown): ErrorBody =>
  typeof data === "object" && data !== null && !Array.isArray(data) ? (data as ErrorBody) : {};

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ?? "http://localhost:1000/api").replace(/\/$/, ""),
  // Render's free tier can take about a minute to wake up
  timeout: 60_000,
});

// Before every request: attach the token if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// After every response: turn every failure into one predictable ApiError
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // A request cancelled on purpose (TanStack Query does this) is not a failure
    if (axios.isCancel(error)) return Promise.reject(error);

    if (!axios.isAxiosError(error)) {
      return Promise.reject(error instanceof Error ? error : new ApiError("Something went wrong"));
    }

    // No response at all: the network is down, the server is asleep, or the request timed out
    if (!error.response) {
      const timedOut = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
      return Promise.reject(
        new ApiError(
          timedOut
            ? "The server took too long to respond. Please try again."
            : "Cannot reach the server. Check your connection and try again.",
          0,
          "NETWORK_ERROR"
        )
      );
    }

    const { status } = error.response;
    const body = toErrorBody(error.response.data);
    const code = typeof body.code === "string" ? body.code : "UNKNOWN";
    const fieldErrors = Array.isArray(body.errors) ? body.errors.filter(isFieldError) : [];
    const message =
      fieldErrors[0]?.message ??
      (typeof body.message === "string" ? body.message : `Request failed (${status})`);

    // A signed-in user whose session stopped working: tell the auth layer.
    // Sign-in attempts are excluded, because a wrong password is also a 401.
    const signedIn = Boolean(localStorage.getItem(AUTH_TOKEN_KEY));
    const isLogin = error.config?.url?.startsWith("/auth/login") ?? false;

    if (signedIn && !isLogin) {
      if (status === 401 && code === "UNAUTHORIZED") {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      }
      if (status === 403 && code === "ACCOUNT_BLOCKED") {
        window.dispatchEvent(new CustomEvent(AUTH_BLOCKED_EVENT, { detail: { reason: body.reason } }));
      }
    }

    return Promise.reject(new ApiError(message, status, code, fieldErrors, body));
  }
);

export default api;
