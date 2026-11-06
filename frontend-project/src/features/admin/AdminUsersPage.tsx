import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  Pencil,
  Search,
  ShieldAlert,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { AdminDialog, Badge, EmptyState, Pagination, TableSkeleton } from "./AdminUI";
import { adminKeys, adminService } from "./adminService";
import type { AdminRole, AdminUser, AdminUserListParams } from "./types";
import { apiErrorMessage, avatarTone, formatDate, formatDateTime, initials } from "./adminUtils";

const PAGE_SIZE = 10;

type UserFormValues = {
  name: string;
  email: string;
  password: string;
  role: AdminRole;
};

function UserFormDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      password: "",
      role: user?.role ?? "user",
    },
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEdit = Boolean(user);

  const onSubmit = async (values: UserFormValues) => {
    setSubmitError(null);
    const password = values.password.trim();

    try {
      if (user) {
        await adminService.updateUser(user.id, {
          name: values.name.trim(),
          email: values.email.trim(),
          role: values.role,
          ...(password ? { password } : {}),
        });
        toast.success("User updated");
      } else {
        await adminService.createUser({
          name: values.name.trim(),
          email: values.email.trim(),
          password,
          role: values.role,
        });
        toast.success("User created");
      }
      onSaved();
      onClose();
    } catch (error) {
      setSubmitError(apiErrorMessage(error));
    }
  };

  return (
    <AdminDialog
      open
      title={isEdit ? "Edit user" : "Create user"}
      description={
        isEdit
          ? "Update account details and permissions. Leave the password blank to keep it unchanged."
          : "Create a new account and choose its access level."
      }
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="admin-user-form"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create user"}
          </button>
        </>
      }
    >
      <form id="admin-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Full name</span>
          <input
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "Name must be at least 2 characters" },
            })}
            className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            placeholder="Jane Cooper"
            autoComplete="name"
          />
          {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name.message}</p>}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-700">Email address</span>
          <input
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address",
              },
            })}
            className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            placeholder="jane@company.com"
            autoComplete="email"
          />
          {errors.email && <p className="mt-1 text-[11px] text-rose-600">{errors.email.message}</p>}
        </label>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              Password {isEdit && <span className="font-normal text-slate-400">(optional)</span>}
            </span>
            <input
              type="password"
              {...register("password", {
                validate: (value) => {
                  if (!isEdit && !value) return "Password is required";
                  if (value && value.length < 8) return "Use at least 8 characters";
                  if (value && !/[A-Za-z]/.test(value)) return "Include at least one letter";
                  if (value && !/[0-9]/.test(value)) return "Include at least one number";
                  return true;
                },
              })}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              placeholder={isEdit ? "Leave blank to keep" : "At least 8 characters"}
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="mt-1 text-[11px] text-rose-600">{errors.password.message}</p>
            )}
          </label>

          <label className="block">
            <span className="text-xs font-medium text-slate-700">Role</span>
            <select
              {...register("role")}
              className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        {submitError && (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {submitError}
          </div>
        )}
      </form>
    </AdminDialog>
  );
}

function BlockUserDialog({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 3) {
      setError("Give a reason of at least 3 characters.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await adminService.blockUser(user.id, reason.trim());
      toast.success(`${user.name} has been blocked`);
      onSaved();
      onClose();
    } catch (submitError) {
      setError(apiErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminDialog
      open
      title="Block user"
      description={`Restrict ${user.name}'s access to the platform.`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="block-user-form"
            disabled={busy}
            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Blocking…" : "Block account"}
          </button>
        </>
      }
    >
      <form id="block-user-form" onSubmit={submit} className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[11px] leading-relaxed text-amber-800">
            Blocked users are signed out and cannot log in until an admin restores access.
          </p>
        </div>
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Reason for blocking</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            maxLength={300}
            className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            placeholder="Explain why this account is being blocked"
          />
          <p className="mt-1 text-right text-[10px] text-slate-400">{reason.length}/300</p>
        </label>
        {error && (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {error}
          </div>
        )}
      </form>
    </AdminDialog>
  );
}

function ConfirmUserDialog({
  user,
  action,
  onClose,
  onSaved,
}: {
  user: AdminUser;
  action: "unblock" | "delete";
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (action === "delete") {
        await adminService.deleteUser(user.id);
        toast.success("User deleted");
      } else {
        await adminService.unblockUser(user.id);
        toast.success(`${user.name} can sign in again`);
      }
      onSaved();
      onClose();
    } catch (submitError) {
      setError(apiErrorMessage(submitError));
    } finally {
      setBusy(false);
    }
  };

  const isDelete = action === "delete";

  return (
    <AdminDialog
      open
      title={isDelete ? "Delete user" : "Unblock user"}
      description={
        isDelete
          ? "This permanently deletes the account. This action cannot be undone."
          : "Restore this account's access to the platform."
      }
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className={`rounded-lg px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              isDelete ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {busy ? "Working…" : isDelete ? "Delete user" : "Unblock user"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs leading-relaxed text-slate-600">
          {user ? (
            <>
              You are about to {isDelete ? "delete" : "unblock"}{" "}
              <span className="font-semibold text-slate-900">{user.name}</span> ({user.email}).
            </>
          ) : null}
        </p>
        {isDelete && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
            Users who own workspaces must have those workspaces deleted or transferred first.
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {error}
          </div>
        )}
      </div>
    </AdminDialog>
  );
}

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [blockingUser, setBlockingUser] = useState<AdminUser | null>(null);
  const [unblockingUser, setUnblockingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  const search = searchParams.get("search") ?? "";
  const roleParam = searchParams.get("role");
  const role: "" | AdminRole = roleParam === "admin" || roleParam === "user" ? roleParam : "";
  const blockedParam = searchParams.get("blocked");
  const blocked: "" | "true" | "false" =
    blockedParam === "true" || blockedParam === "false" ? blockedParam : "";
  const rawPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const params: AdminUserListParams = {
    search: search || undefined,
    role: role || undefined,
    blocked: blocked || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.users(params),
    placeholderData: keepPreviousData,
  });

  const updateQuery = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === "") next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  };

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.all });
  };

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("search") ?? "").trim();
    updateQuery({ search: value || undefined, page: undefined });
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const filtersActive = Boolean(search || role || blocked);
  const users = data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Users</h1>
          <p className="mt-1 text-xs text-slate-500">
            Create accounts, manage roles, and control platform access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <UserPlus className="h-3.5 w-3.5" />
          Add user
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-900/[0.03]">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3">
          <form onSubmit={onSearch} className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              key={search}
              name="search"
              defaultValue={search}
              placeholder="Search name or email…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </form>

          <select
            value={role}
            onChange={(event) => updateQuery({ role: event.target.value, page: undefined })}
            aria-label="Filter by role"
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>

          <select
            value={blocked}
            onChange={(event) => updateQuery({ blocked: event.target.value, page: undefined })}
            aria-label="Filter by status"
            className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-600 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">All statuses</option>
            <option value="false">Active</option>
            <option value="true">Blocked</option>
          </select>

          {filtersActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </button>
          )}

          {isFetching && !isLoading && (
            <span className="ml-auto text-[11px] text-slate-400">Updating…</span>
          )}
        </div>

        {isLoading ? (
          <TableSkeleton rows={7} columns={6} />
        ) : isError ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-800">Could not load users</p>
            <p className="mt-1 text-xs text-slate-500">Check the backend and try again.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title={filtersActive ? "No users match these filters" : "No users yet"}
            description={
              filtersActive
                ? "Try a different search term or clear the filters."
                : "Create the first user account to get started."
            }
            action={
              filtersActive ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">User</th>
                    <th className="px-4 py-2.5 font-semibold">Role</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                    <th className="px-4 py-2.5 font-semibold">Workspaces</th>
                    <th className="px-4 py-2.5 font-semibold">Joined</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id} className="group transition hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${avatarTone(user.name)}`}
                          >
                            {initials(user.name) || "U"}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800">
                              {user.name}
                            </p>
                            <p className="truncate text-[11px] text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={user.role === "admin" ? "brand" : "neutral"}>
                          {user.role === "admin" ? "Admin" : "User"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span title={user.blockReason ?? undefined}>
                          <Badge tone={user.blocked ? "danger" : "success"}>
                            {user.blocked ? "Blocked" : "Active"}
                          </Badge>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{user.workspaceCount}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-600">{formatDate(user.createdAt)}</p>
                        <p className="text-[10px] text-slate-400">
                          Last login {formatDateTime(user.lastLoginAt)}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Edit user"
                            aria-label={`Edit ${user.name}`}
                            onClick={() => {
                              setEditingUser(user);
                              setFormOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {user.blocked ? (
                            <button
                              type="button"
                              title="Unblock user"
                              aria-label={`Unblock ${user.name}`}
                              onClick={() => setUnblockingUser(user)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Block user"
                              aria-label={`Block ${user.name}`}
                              onClick={() => setBlockingUser(user)}
                              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-amber-50 hover:text-amber-600"
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            title="Delete user"
                            aria-label={`Delete ${user.name}`}
                            onClick={() => setDeletingUser(user)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              limit={PAGE_SIZE}
              total={data?.total ?? 0}
              onPage={(next) => updateQuery({ page: next <= 1 ? undefined : String(next) })}
            />
          </>
        )}
      </div>

      {formOpen && (
        <UserFormDialog
          key={editingUser?.id ?? "create"}
          user={editingUser}
          onClose={() => setFormOpen(false)}
          onSaved={refresh}
        />
      )}
      {blockingUser && (
        <BlockUserDialog
          user={blockingUser}
          onClose={() => setBlockingUser(null)}
          onSaved={refresh}
        />
      )}
      {unblockingUser && (
        <ConfirmUserDialog
          user={unblockingUser}
          action="unblock"
          onClose={() => setUnblockingUser(null)}
          onSaved={refresh}
        />
      )}
      {deletingUser && (
        <ConfirmUserDialog
          user={deletingUser}
          action="delete"
          onClose={() => setDeletingUser(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
