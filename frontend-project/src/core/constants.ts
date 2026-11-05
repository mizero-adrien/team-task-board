export const AUTH_TOKEN_KEY = "token";
export const AUTH_USER_KEY = "user";

// Sent by the API layer so the auth layer can react, without the two importing each other
export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";
export const AUTH_BLOCKED_EVENT = "auth:blocked";
