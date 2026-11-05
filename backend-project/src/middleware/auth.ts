import { adminOnly, protect } from "./auth.middleware";

export const authenticate = protect;
export const requireAdmin = adminOnly;
