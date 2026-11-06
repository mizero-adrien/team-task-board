export type AdminRole = "user" | "admin";

export type DayCount = { date: string; count: number };

export type AdminStats = {
  users: number;
  blockedUsers: number;
  workspaces: number;
  cardsThisWeek: number;
  aiBreakdownsToday: number;
  cardsByDay: DayCount[];
  usersByDay: DayCount[];
  workspacesByDay: DayCount[];
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  blocked: boolean;
  blockReason: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceCount: number;
};

export type AdminWorkspace = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  boardCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type AdminUserListParams = {
  search?: string;
  blocked?: "" | "true" | "false";
  role?: "" | AdminRole;
  page?: number;
  limit?: number;
};

export type AdminWorkspaceListParams = {
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateAdminUserInput = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
};

export type UpdateAdminUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: AdminRole;
};

export type CreateAdminWorkspaceInput = {
  name: string;
  description?: string | null;
  ownerId: string;
};

export type UpdateAdminWorkspaceInput = {
  name?: string;
  description?: string | null;
};
