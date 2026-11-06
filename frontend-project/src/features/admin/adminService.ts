import api from "../../core/api/client";
import type {
  AdminStats,
  AdminUser,
  AdminUserListParams,
  AdminWorkspace,
  AdminWorkspaceListParams,
  CreateAdminUserInput,
  CreateAdminWorkspaceInput,
  Page,
  UpdateAdminUserInput,
  UpdateAdminWorkspaceInput,
} from "./types";

const withValues = <T extends Record<string, unknown>>(params: T) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );

export const adminKeys = {
  all: ["admin"] as const,
  stats: () => ["admin", "stats"] as const,
  users: (params: AdminUserListParams) => ["admin", "users", params] as const,
  userOptions: () => ["admin", "users", "options"] as const,
  workspaces: (params: AdminWorkspaceListParams) => ["admin", "workspaces", params] as const,
};

export const adminService = {
  stats: async (): Promise<AdminStats> => {
    const response = await api.get<AdminStats>("/admin/stats");
    return response.data;
  },

  users: async (params: AdminUserListParams = {}): Promise<Page<AdminUser>> => {
    const response = await api.get<Page<AdminUser>>("/admin/users", {
      params: withValues(params as Record<string, unknown>),
    });
    return response.data;
  },

  createUser: async (input: CreateAdminUserInput): Promise<AdminUser> => {
    const response = await api.post<AdminUser>("/admin/users", input);
    return response.data;
  },

  updateUser: async (userId: string, input: UpdateAdminUserInput): Promise<AdminUser> => {
    const response = await api.patch<AdminUser>(`/admin/users/${userId}`, input);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/admin/users/${userId}`);
  },

  blockUser: async (userId: string, reason: string): Promise<AdminUser> => {
    const response = await api.post<AdminUser>(`/admin/users/${userId}/block`, { reason });
    return response.data;
  },

  unblockUser: async (userId: string): Promise<AdminUser> => {
    const response = await api.post<AdminUser>(`/admin/users/${userId}/unblock`);
    return response.data;
  },

  workspaces: async (
    params: AdminWorkspaceListParams = {},
  ): Promise<Page<AdminWorkspace>> => {
    const response = await api.get<Page<AdminWorkspace>>("/admin/workspaces", {
      params: withValues(params as Record<string, unknown>),
    });
    return response.data;
  },

  createWorkspace: async (input: CreateAdminWorkspaceInput): Promise<AdminWorkspace> => {
    const response = await api.post<AdminWorkspace>("/admin/workspaces", input);
    return response.data;
  },

  updateWorkspace: async (
    workspaceId: string,
    input: UpdateAdminWorkspaceInput,
  ): Promise<AdminWorkspace> => {
    const response = await api.patch<AdminWorkspace>(`/admin/workspaces/${workspaceId}`, input);
    return response.data;
  },

  deleteWorkspace: async (workspaceId: string): Promise<void> => {
    await api.delete(`/admin/workspaces/${workspaceId}`);
  },
};
