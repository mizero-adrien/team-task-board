import bcrypt from "bcryptjs";
import { User, type IUser } from "../models/User";
import { HttpError } from "../utils/HttpError";
import { signToken } from "../utils/token";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";

export type PublicUser = { id: string; name: string; email: string; role: IUser["role"] };

// Exactly the fields api.md promises, nothing more
export const toPublicUser = (user: IUser): PublicUser => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  role: user.role,
});

// Compared against when the email does not exist, so "unknown email" and
// "wrong password" take about the same time and cannot be told apart.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function registerUser({ name, email, password }: RegisterInput): Promise<PublicUser> {
  try {
    // role is never taken from the client: the model default ("user") applies
    const user = await User.create({ name, email, password });
    return toPublicUser(user);
  } catch (error) {
    // 11000 is MongoDB's "duplicate key" error, raised by the unique email index
    if ((error as { code?: number }).code === 11000) {
      throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }
    throw error;
  }
}

export async function loginUser({ email, password }: LoginInput) {
  const user = await User.findOne({ email }).select("+password");

  const passwordMatches = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

  // One message for both cases, so nobody can find out which emails have accounts
  if (!user || !passwordMatches) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // Checked only AFTER the password is right, so a stranger cannot learn
  // that an account is blocked (or why) without knowing the password.
  if (user.blocked) {
    throw new HttpError(403, "ACCOUNT_BLOCKED", "Your account has been blocked", {
      reason: user.blockReason ?? null,
      blockedAt: user.blockedAt ?? null,
    });
  }

  await User.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

  return { token: signToken(String(user._id)), user: toPublicUser(user) };
}