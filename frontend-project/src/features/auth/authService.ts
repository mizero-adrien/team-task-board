import api from "../../core/api/client";
import type { AuthResponse, Credentials, SignUpData, User } from "./types";

export const authService = {
  login: async (credentials: Credentials): Promise<AuthResponse> =>
    (await api.post<AuthResponse>("/auth/login", credentials)).data,

  // The server returns the new user but no token, so the caller signs in afterwards
  register: async (data: SignUpData): Promise<User> => (await api.post<User>("/auth/register", data)).data,

  me: async (): Promise<User> => (await api.get<User>("/auth/me")).data,
};
