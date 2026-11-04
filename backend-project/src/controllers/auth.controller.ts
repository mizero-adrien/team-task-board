import { asyncHandler } from "../utils/AsyncHandler";
import { loginUser, registerUser } from "../services/auth.service";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";

export const register = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body as RegisterInput);
  res.status(201).json(user);
});

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body as LoginInput);
  res.json(result);
});

// protect has already loaded and checked the user
export const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});