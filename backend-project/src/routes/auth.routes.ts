import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../schemas/auth.schema";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.get("/me", protect, me);

// Added in a later step: forgot-password and reset-password (they need Brevo)

export default router;