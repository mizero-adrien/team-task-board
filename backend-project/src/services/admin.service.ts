import { Types, type Model, type QueryFilter } from "mongoose";
import { Activity } from "../models/Activity";
import { AiRequest } from "../models/AiRequest";
import { AiUsage } from "../models/AiUsage";
import { Board } from "../models/Board";
import { Card } from "../models/Card";
import { Comment } from "../models/Comment";
import { Invite } from "../models/Invite";
import { List } from "../models/List";
import { User, type IUser } from "../models/User";
import { Workspace, type IWorkspace } from "../models/Workspace";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { createWorkspace } from "./workspace.service";
import { APP_TIME_ZONE, addDays, todayString } from "../utils/dates";
import { HttpError } from "../utils/HttpError";
import { serializeUser } from "../utils/serialize";
import type {
  AdminUserListQuery,
  AdminWorkspaceListQuery,
  BlockUserInput,
  CreateAdminUserInput,
  CreateAdminWorkspaceInput,
  UpdateAdminUserInput,
  UpdateAdminWorkspaceInput,
} from "../validators/admin.validator";

type DayCount = { date: string; count: number };

type AdminUserDto = ReturnType<typeof serializeUser> & { workspaceCount: number };

type AdminWorkspaceDto = {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerName: string;
  memberCount: number;
  boardCount: number;
  createdAt: Date;
  updatedAt: Date;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pageValues = (input: { page?: number; limit?: number }) => {
  const page = Math.max(1, Number(input.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(input.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
};

async function dailyCounts<T>(model: Model<T>, days: string[]): Promise<DayCount[]> {
  const from = addDays(days[0], -1);
  const to = addDays(days[days.length - 1], 1);

  const rows = await model.aggregate<{ _id: string; count: number }>([
    {
      $match: {
        createdAt: {
          $gte: new Date(`${from}T00:00:00.000Z`),
          $lt: new Date(`${to}T00:00:00.000Z`),
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: APP_TIME_ZONE },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const counts = new Map(rows.map((row) => [row._id, row.count]));
  return days.map((date) => ({ date, count: counts.get(date) ?? 0 }));
}

async function countsByField<T>(
  model: Model<T>,
  field: string,
  ids: Types.ObjectId[],
): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();

  const rows = await model.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { [field]: { $in: ids } } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.count]));
}

async function toAdminUser(user: IUser): Promise<AdminUserDto> {
  const workspaceCount = await WorkspaceMember.countDocuments({ userId: user._id });
  return { ...serializeUser(user), workspaceCount };
}

export async function getAdminStats() {
  const today = todayString();
  const days = Array.from({ length: 7 }, (_, index) => addDays(today, index - 6));

  const [
    users,
    blockedUsers,
    workspaces,
    cardsByDay,
    usersByDay,
    workspacesByDay,
    aiToday,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ blocked: true }),
    Workspace.countDocuments(),
    dailyCounts(Card, days),
    dailyCounts(User, days),
    dailyCounts(Workspace, days),
    AiRequest.aggregate<{ count: number }>([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${addDays(today, -1)}T00:00:00.000Z`),
            $lt: new Date(`${addDays(today, 1)}T00:00:00.000Z`),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: APP_TIME_ZONE },
          },
          count: { $sum: 1 },
        },
      },
      { $match: { _id: today } },
      { $project: { _id: 0, count: 1 } },
    ]),
  ]);

  return {
    users,
    blockedUsers,
    workspaces,
    cardsThisWeek: cardsByDay.reduce((total, day) => total + day.count, 0),
    aiBreakdownsToday: aiToday[0]?.count ?? 0,
    cardsByDay,
    usersByDay,
    workspacesByDay,
  };
}

export async function listAdminUsers(input: AdminUserListQuery) {
  const { page, limit, skip } = pageValues(input);
  const filter: QueryFilter<IUser> = {};

  if (input.search) {
    const regex = new RegExp(escapeRegex(input.search), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (input.blocked) filter.blocked = input.blocked === "true";
  if (input.role) filter.role = input.role;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  const counts = await countsByField(
    WorkspaceMember,
    "userId",
    users.map((user) => user._id),
  );

  return {
    items: users.map((user) => ({
      ...serializeUser(user),
      workspaceCount: counts.get(String(user._id)) ?? 0,
    })),
    total,
    page,
    limit,
  };
}

export async function createAdminUser(input: CreateAdminUserInput): Promise<AdminUserDto> {
  try {
    const user = await User.create(input);
    return toAdminUser(user);
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }
    throw error;
  }
}

export async function updateAdminUser(
  userId: string,
  adminId: string,
  input: UpdateAdminUserInput,
): Promise<AdminUserDto> {
  if (userId === adminId && input.role && input.role !== "admin") {
    throw new HttpError(400, "VALIDATION_FAILED", "You cannot remove your own admin role");
  }

  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");

  if (input.name !== undefined) user.name = input.name;
  if (input.email !== undefined) user.email = input.email;
  if (input.role !== undefined) user.role = input.role;
  if (input.password !== undefined) user.password = input.password;

  try {
    await user.save();
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }
    throw error;
  }

  return toAdminUser(user);
}

export async function blockAdminUser(
  userId: string,
  adminId: string,
  input: BlockUserInput,
): Promise<AdminUserDto> {
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");

  if (user.role === "admin") {
    throw new HttpError(400, "CANNOT_BLOCK_ADMIN", "Admin accounts cannot be blocked");
  }

  user.blocked = true;
  user.blockReason = input.reason;
  user.blockedAt = new Date();
  user.blockedBy = new Types.ObjectId(adminId);
  await user.save();

  return toAdminUser(user);
}

export async function unblockAdminUser(userId: string): Promise<AdminUserDto> {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { blocked: false }, $unset: { blockReason: 1, blockedAt: 1, blockedBy: 1 } },
    { new: true },
  );

  if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");
  return toAdminUser(user);
}

export async function deleteAdminUser(userId: string, adminId: string): Promise<void> {
  if (userId === adminId) {
    throw new HttpError(400, "VALIDATION_FAILED", "You cannot delete your own account");
  }

  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");

  if (user.role === "admin") {
    throw new HttpError(403, "FORBIDDEN", "Admin accounts cannot be deleted");
  }

  const ownedWorkspaces = await Workspace.countDocuments({ ownerId: user._id });
  if (ownedWorkspaces > 0) {
    throw new HttpError(
      409,
      "CONFLICT",
      "This user owns workspaces. Delete or transfer those workspaces first.",
    );
  }

  await Promise.all([
    WorkspaceMember.deleteMany({ userId: user._id }),
    Card.updateMany({ assignee: user._id }, { $set: { assignee: null } }),
    Comment.deleteMany({ author: user._id }),
    AiRequest.deleteMany({ user: user._id }),
    AiUsage.deleteMany({ user: user._id }),
    Invite.updateMany({ invitedBy: user._id }, { $set: { invitedBy: null } }),
  ]);

  await User.findByIdAndDelete(user._id);
}

export async function listAdminWorkspaces(input: AdminWorkspaceListQuery) {
  const { page, limit, skip } = pageValues(input);
  const filter: QueryFilter<IWorkspace> = {};

  if (input.search) {
    filter.name = new RegExp(escapeRegex(input.search), "i");
  }

  const [workspaces, total] = await Promise.all([
    Workspace.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Workspace.countDocuments(filter),
  ]);

  const workspaceIds = workspaces.map((workspace) => workspace._id);
  const ownerIds = workspaces.map((workspace) => workspace.ownerId);
  const [owners, memberCounts, boardCounts] = await Promise.all([
    User.find({ _id: { $in: ownerIds } }).select("name").lean(),
    countsByField(WorkspaceMember, "workspaceId", workspaceIds),
    countsByField(Board, "workspace", workspaceIds),
  ]);
  const ownerNames = new Map(owners.map((owner) => [String(owner._id), owner.name]));

  return {
    items: workspaces.map((workspace) => ({
      id: String(workspace._id),
      name: workspace.name,
      description: workspace.description ?? null,
      ownerId: String(workspace.ownerId),
      ownerName: ownerNames.get(String(workspace.ownerId)) ?? "Unknown user",
      memberCount: memberCounts.get(String(workspace._id)) ?? 0,
      boardCount: boardCounts.get(String(workspace._id)) ?? 0,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    })),
    total,
    page,
    limit,
  };
}

async function toAdminWorkspace(workspace: IWorkspace): Promise<AdminWorkspaceDto> {
  const [owner, memberCount, boardCount] = await Promise.all([
    User.findById(workspace.ownerId).select("name").lean(),
    WorkspaceMember.countDocuments({ workspaceId: workspace._id }),
    Board.countDocuments({ workspace: workspace._id }),
  ]);

  return {
    id: String(workspace._id),
    name: workspace.name,
    description: workspace.description ?? null,
    ownerId: String(workspace.ownerId),
    ownerName: owner?.name ?? "Unknown user",
    memberCount,
    boardCount,
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  };
}

export async function createAdminWorkspace(
  input: CreateAdminWorkspaceInput,
): Promise<AdminWorkspaceDto> {
  const owner = await User.findById(input.ownerId).select("name").lean();
  if (!owner) throw new HttpError(404, "NOT_FOUND", "Owner not found");

  const workspace = await createWorkspace(input.ownerId, {
    name: input.name,
    description: input.description ?? null,
  });

  return toAdminWorkspace(workspace);
}

export async function updateAdminWorkspace(
  workspaceId: string,
  input: UpdateAdminWorkspaceInput,
): Promise<AdminWorkspaceDto> {
  const workspace = await Workspace.findByIdAndUpdate(workspaceId, input, {
    new: true,
    runValidators: true,
  });

  if (!workspace) throw new HttpError(404, "NOT_FOUND", "Workspace not found");
  return toAdminWorkspace(workspace);
}

export async function deleteAdminWorkspace(workspaceId: string): Promise<void> {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) throw new HttpError(404, "NOT_FOUND", "Workspace not found");

  const boardIds = (await Board.find({ workspace: workspace._id }).select("_id")).map(
    (board) => board._id,
  );

  await Promise.all([
    Activity.deleteMany({ workspace: workspace._id }),
    Comment.deleteMany({ workspace: workspace._id }),
    Card.deleteMany({ workspace: workspace._id }),
    List.deleteMany({ boardId: { $in: boardIds } }),
    Board.deleteMany({ workspace: workspace._id }),
    Invite.deleteMany({ workspaceId: workspace._id }),
    WorkspaceMember.deleteMany({ workspaceId: workspace._id }),
    AiRequest.deleteMany({ workspace: workspace._id }),
  ]);

  await Workspace.findByIdAndDelete(workspace._id);
}
