import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  ArrowUpRight,
  Folders,
  KanbanSquare,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { adminKeys, adminService } from "./adminService";
import type { DayCount } from "./types";
import { formatDay, formatDayLong } from "./adminUtils";

type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  iconClassName: string;
};

function StatCard({ label, value, detail, icon: Icon, iconClassName }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 border-t border-slate-100 pt-2.5 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}

type ChartCardProps = {
  title: string;
  description: string;
  total: number;
  data: DayCount[];
  accent: string;
};

function ChartCard({ title, description, total, data, accent }: ChartCardProps) {
  const max = Math.max(1, ...data.map((day) => day.count));

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1 text-right">
          <p className="text-sm font-semibold text-slate-800">{total}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-400">7 days</p>
        </div>
      </div>

      <div className="mt-6 flex items-end gap-2 sm:gap-3">
        {data.map((day) => (
          <div key={day.date} className="group flex min-w-0 flex-1 flex-col items-center gap-2">
            <span className="text-[10px] font-medium text-slate-400">{day.count}</span>
            <div
              className="flex h-28 w-full items-end"
              title={`${formatDayLong(day.date)}: ${day.count}`}
            >
              <div
                className={`w-full rounded-t-md ${accent} transition-all duration-300 group-hover:opacity-80`}
                style={{ height: `${Math.max(4, (day.count / max) * 100)}%` }}
              />
            </div>
            <span className="truncate text-[10px] font-medium text-slate-500">
              {formatDay(day.date)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const sum = (data: DayCount[]) => data.reduce((total, day) => total + day.count, 0);

function OverviewSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: adminKeys.stats(),
    queryFn: adminService.stats,
  });

  if (isLoading) return <OverviewSkeleton />;

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
        <ShieldAlert className="h-9 w-9 text-rose-500" />
        <h2 className="mt-4 text-sm font-semibold text-slate-900">Could not load admin analytics</h2>
        <p className="mt-1 max-w-sm text-xs text-slate-500">
          The admin API did not respond. Check that the backend is running and try again.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </button>
      </div>
    );
  }

  const newUsers = sum(data.usersByDay);
  const newWorkspaces = sum(data.workspacesByDay);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-900">
            Platform overview
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Live health and activity across users, workspaces, and AI tools.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total users"
          value={data.users.toLocaleString()}
          detail={`${newUsers} new in the last 7 days · ${data.blockedUsers} blocked`}
          icon={Users}
          iconClassName="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          label="Workspaces"
          value={data.workspaces.toLocaleString()}
          detail={`${newWorkspaces} created in the last 7 days`}
          icon={Folders}
          iconClassName="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Cards this week"
          value={data.cardsThisWeek.toLocaleString()}
          detail="Created across all boards"
          icon={KanbanSquare}
          iconClassName="bg-sky-50 text-sky-600"
        />
        <StatCard
          label="AI breakdowns today"
          value={data.aiBreakdownsToday.toLocaleString()}
          detail="Generated from card details"
          icon={Sparkles}
          iconClassName="bg-violet-50 text-violet-600"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <ChartCard
          title="Cards created"
          description="New cards over the last 7 days"
          total={data.cardsThisWeek}
          data={data.cardsByDay}
          accent="bg-sky-500"
        />
        <ChartCard
          title="New users"
          description="Sign-ups over the last 7 days"
          total={newUsers}
          data={data.usersByDay}
          accent="bg-indigo-500"
        />
        <ChartCard
          title="Workspaces created"
          description="New workspaces over the last 7 days"
          total={newWorkspaces}
          data={data.workspacesByDay}
          accent="bg-emerald-500"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-900/[0.03] lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Jump into the day-to-day admin workflows.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              to="/admin/users"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 transition hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                  <Users className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Manage users</p>
                  <p className="text-[11px] text-slate-500">Create, edit, block, or remove</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-indigo-500" />
            </Link>
            <Link
              to="/admin/workspaces"
              className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 transition hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                  <Folders className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Manage workspaces</p>
                  <p className="text-[11px] text-slate-500">Inspect, edit, or delete spaces</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-400 transition group-hover:text-emerald-500" />
            </Link>
          </div>
        </div>

        <Link
          to="/admin/users?blocked=true"
          className="group rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm shadow-amber-900/[0.03] transition hover:border-amber-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <ArrowUpRight className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
            {data.blockedUsers}
          </p>
          <p className="text-xs font-medium text-amber-800">Blocked accounts</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-700/80">
            Review restricted accounts and restore access when appropriate.
          </p>
        </Link>
      </div>
    </div>
  );
}
