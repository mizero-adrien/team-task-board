export type Role = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthResponse = { token: string; user: User };
export type Credentials = { email: string; password: string };
export type SignUpData = Credentials & { name: string };
