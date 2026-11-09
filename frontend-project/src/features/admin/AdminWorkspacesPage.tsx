import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  FolderPlus,
  Folders,
  Pencil,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { AdminDialog, EmptyState, Pagination, TableSkeleton } from "./AdminUI";
import { adminKeys, adminService } from "./adminService";
import type { AdminUser, AdminWorkspace, AdminWorkspaceListParams } from "./types";
import { apiErrorMessage, avatarTone, formatDate, initials } from "./adminUtils";

const PAGE_SIZE = 10;

type WorkspaceFormValues = {
  name: string;
  description: string;
};

function WorkspaceFormDialog({
  workspace,
  onClose,
  onSaved,
}: {
  workspace: AdminWorkspace | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WorkspaceFormValues>({
    defaultValues: {
      name: workspace?.name ?? "",
      description: workspace?.description ?? "",
    },
  });
  const [owner, setOwner] = useState<AdminUser | null>(null);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEdit = Boolean(workspace);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(ownerSearch.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [ownerSearch]);

  const { data: ownerResults, isFetching: ownersFetching } = useQuery({
    queryKey: adminKeys.users({ search: debouncedSearch || undefined, limit: 20 }),
    queryFn: () => adminService.users({ search: debouncedSearch || undefined, limit: 20 }),
    enabled: !isEdit,
  });

  const onSubmit = async (values: WorkspaceFormValues) => {
    setSubmitError(null);
    if (!isEdit && !owner) {
      setSubmitError("Select an owner for the workspace.");
      return;
    }

    try {
      if (workspace) {
        await adminService.updateWorkspace(workspace.id, {
          name: values.name.trim(),
          description: values.description.trim() || null,
        });
        toast.success("Workspace updated");
      } else if (owner) {
        await adminService.createWorkspace({
          name: values.name.trim(),
          description: values.description.trim() || null,
          ownerId: owner.id,
        });
        toast.success("Workspace created");
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
      wide
      title={isEdit ? "Edit workspace" : "Create workspace"}
      description={
        isEdit
          ? "Update the workspace name and description."
          : "Create a workspace and assign it to an owner."
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
            form="admin-workspace-form"
            disabled={isSubmitting}
            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create workspace"}
          </button>
        </>
      }
    >
      <form id="admin-workspace-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        <label className="block">
          <span className="text-xs font-medium text-slate-700">Workspace name</span>
          <input
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "Name must be at least 2 characters" },
            })}
            className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            placeholder="Product team"
          />
          {errors.name && <p className="mt-1 text-[11px] text-rose-600">{errors.name.message}</p>}
        </label>

        <label className="block">
          <span className="text-xs font-medium text-slate-700">
            Description <span className="font-normal text-slate-400">(optional)</span>
          </span>
          <textarea
            {...register("description", { maxLength: { value: 300, message: "Use 300 characters or fewer" } })}
            rows={2}
            className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            placeholder="What this workspace is for"
          />
          {errors.description && (
            <p className="mt-1 text-[11px] text-rose-600">{errors.description.message}</p>
          )}
        </label>

        {isEdit ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Owner</p>
            <p className="mt-0.5 text-xs font-semibold text-slate-800">{workspace?.ownerName}</p>
          </div>
        ) : (
          <div>
            <span className="text-xs font-medium text-slate-700">Owner</span>
            {owner ? (
              <div className="mt-1 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold ${avatarTone(owner.name)}`}
                  >
                    {initials(owner.name) || "U"}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{owner.name}</p>
                    <p className="text-[10px] text-slate-500">{owner.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOwner(null);
                    setOwnerSearch("");
                  }}
                  className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-600"
                  aria-label="Change owner"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="mt-1">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={ownerSearch}
                    onChange={(event) => setOwnerSearch(event.target.value)}
                    placeholder="Search people by name or email…"
                    className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div className="mt-1.5 max-h-36 overflow-y-auto rounded-lg border border-slate-200">
                  {ownersFetching ? (
                    <p className="px-3 py-3 text-[11px] text-slate-400">Searching people…</p>
                  ) : ownerResults?.items.length ? (
                    ownerResults.items.map((candidate) => (
                      <button
                        key={candidate.id}
                        type="button"
                        onClick={() => setOwner(candidate)}
                        className="flex w-full items-center gap-2 border-b border-slate-100 px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                      >
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold ${avatarTone(candidate.name)}`}
                        >
                          {initials(candidate.name) || "U"}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium text-slate-700">
                            {candidate.name}
                          </span>
                          <span className="block truncate text-[10px] text-slate-400">
                            {candidate.email}
                          </span>
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-3 text-[11px] text-slate-400">No matching users.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {submitError}
          </div>
        )}
      </form>
    </AdminDialog>
  );
}

function DeleteWorkspaceDialog({
  workspace,
  onClose,
  onSaved,
}: {
  workspace: AdminWorkspace;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await adminService.deleteWorkspace(workspace.id);
      toast.success("Workspace deleted");
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
      title="Delete workspace"
      description="This permanently deletes the workspace and everything inside it."
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
            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Deleting…" : "Delete workspace"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs leading-relaxed text-slate-600">
          You are about to delete{" "}
          <span className="font-semibold text-slate-900">{workspace?.name}</span>. This removes{" "}
          {workspace?.boardCount ?? 0} board{(workspace?.boardCount ?? 0) === 1 ? "" : "s"} and all
          associated lists, cards, comments, activity, invites, and members.
        </p>
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
          This action cannot be undone.
        </div>
        {error && (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-[11px] text-rose-700">
            {error}
          </div>
        )}
      </div>
    </AdminDialog>
  );
}

export default function AdminWorkspacesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<AdminWorkspace | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<AdminWorkspace | null>(null);

  const search = searchParams.get("search") ?? "";
  const rawPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const params: AdminWorkspaceListParams = {
    search: search || undefined,
    page,
    limit: PAGE_SIZE,
  };

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: adminKeys.workspaces(params),
    queryFn: () => adminService.workspaces(params),
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

  const workspaces = data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">Workspaces</h1>
          <p className="mt-1 text-xs text-slate-500">
            Inspect ownership, activity, and workspace lifecycle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingWorkspace(null);
            setFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          Add workspace
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
              placeholder="Search workspaces…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-9 pr-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
          </form>

          {search && (
            <button
              type="button"
              onClick={() => setSearchParams({}, { replace: true })}
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
            <p className="text-sm font-medium text-slate-800">Could not load workspaces</p>
            <p className="mt-1 text-xs text-slate-500">Check the backend and try again.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Try again
            </button>
          </div>
        ) : workspaces.length === 0 ? (
          <EmptyState
            icon={Folders}
            title={search ? "No workspaces match this search" : "No workspaces yet"}
            description={
              search
                ? "Try a different search term or clear the search."
                : "Create a workspace and assign it to an owner."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left">
                <thead className="bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Workspace</th>
                    <th className="px-4 py-2.5 font-semibold">Owner</th>
                    <th className="px-4 py-2.5 font-semibold">Members</th>
                    <th className="px-4 py-2.5 font-semibold">Boards</th>
                    <th className="px-4 py-2.5 font-semibold">Created</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {workspaces.map((workspace) => (
                    <tr key={workspace.id} className="group transition hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-800">
                              {workspace.name}
                            </p>
                            <p className="max-w-[280px] truncate text-[11px] text-slate-500">
                              {workspace.description || "No description"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold ${avatarTone(workspace.ownerName)}`}
                          >
                            {initials(workspace.ownerName) || "U"}
                          </span>
                          <span className="text-xs text-slate-600">{workspace.ownerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <UserRound className="h-3 w-3 text-slate-400" />
                          {workspace.memberCount}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                          <Folders className="h-3 w-3 text-slate-400" />
                          {workspace.boardCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {formatDate(workspace.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Edit workspace"
                            aria-label={`Edit ${workspace.name}`}
                            onClick={() => {
                              setEditingWorkspace(workspace);
                              setFormOpen(true);
                            }}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete workspace"
                            aria-label={`Delete ${workspace.name}`}
                            onClick={() => setDeletingWorkspace(workspace)}
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
        <WorkspaceFormDialog
          key={editingWorkspace?.id ?? "create"}
          workspace={editingWorkspace}
          onClose={() => setFormOpen(false)}
          onSaved={refresh}
        />
      )}
      {deletingWorkspace && (
        <DeleteWorkspaceDialog
          workspace={deletingWorkspace}
          onClose={() => setDeletingWorkspace(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
