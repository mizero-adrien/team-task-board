import "dotenv/config";
import { Types } from "mongoose";
import { connectDB, disconnectDB } from "../config/db";
import { Board } from "../models/Board";
import { Workspace } from "../models/Workspace";

type LegacyBoard = {
  _id: Types.ObjectId;
  name?: string;
  workspace?: unknown;
  workspaceId?: unknown;
  createdBy?: unknown;
};

const apply = process.argv.includes("--apply");

const asObjectId = (value: unknown): Types.ObjectId | null => {
  if (value instanceof Types.ObjectId) return value;
  if (typeof value === "string" && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }
  return null;
};

const sameId = (left: Types.ObjectId, right: Types.ObjectId) => left.equals(right);

async function main() {
  await connectDB();

  const filter = {
    $or: [
      { workspaceId: { $exists: true } },
      { workspace: { $exists: false } },
      { createdBy: { $exists: false } },
    ],
  };

  const total = await Board.collection.countDocuments(filter);
  const owners = new Map<string, Types.ObjectId | null>();
  const stats = {
    scanned: total,
    migrated: 0,
    planned: 0,
    conflicts: 0,
    missingWorkspace: 0,
    invalidWorkspace: 0,
    missingOwner: 0,
    errors: 0,
  };
  const problems: string[] = [];

  for await (const raw of Board.collection.find(filter)) {
    const board = raw as unknown as LegacyBoard;
    const legacyWorkspace = asObjectId(board.workspaceId);
    const currentWorkspace = asObjectId(board.workspace);

    if (board.workspace != null && currentWorkspace === null) {
      stats.invalidWorkspace += 1;
      problems.push(`${board._id}: workspace is not a valid ObjectId`);
      continue;
    }

    if (board.workspaceId != null && legacyWorkspace === null) {
      stats.invalidWorkspace += 1;
      problems.push(`${board._id}: workspaceId is not a valid ObjectId`);
      continue;
    }

    if (currentWorkspace && legacyWorkspace && !sameId(currentWorkspace, legacyWorkspace)) {
      stats.conflicts += 1;
      problems.push(
        `${board._id}: workspace and workspaceId point to different workspaces`
      );
      continue;
    }

    const workspace = currentWorkspace ?? legacyWorkspace;
    if (!workspace) {
      stats.missingWorkspace += 1;
      problems.push(`${board._id}: no workspace or workspaceId`);
      continue;
    }

    let createdBy = asObjectId(board.createdBy);
    if (!createdBy) {
      const key = String(workspace);
      if (!owners.has(key)) {
        const owner = await Workspace.collection.findOne(
          { _id: workspace },
          { projection: { ownerId: 1 } }
        );
        owners.set(key, asObjectId(owner?.ownerId));
      }
      createdBy = owners.get(key) ?? null;
      if (!createdBy) {
        stats.missingOwner += 1;
        problems.push(`${board._id}: workspace ${workspace} has no owner to use as createdBy`);
      }
    }

    const set: Record<string, unknown> = { workspace };
    if (createdBy) set.createdBy = createdBy;
    const unset: Record<string, ""> = {};
    if (board.workspaceId !== undefined) unset.workspaceId = "";

    try {
      if (apply) {
        await Board.collection.updateOne(
          { _id: board._id },
          {
            $set: set,
            ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
          }
        );
        stats.migrated += 1;
        console.log(`MIGRATED ${board._id} ${board.name ?? ""}`);
      } else {
        stats.planned += 1;
        console.log(
          `PLAN     ${board._id} workspace=${workspace} createdBy=${createdBy ?? "MISSING"} ${
            legacyWorkspace ? "unset workspaceId" : ""
          }`
        );
      }
    } catch (error) {
      stats.errors += 1;
      problems.push(`${board._id}: ${(error as Error).message}`);
    }
  }

  if (problems.length > 0) {
    console.log("\nProblems:");
    for (const problem of problems) console.log(`  ${problem}`);
  }

  console.log("\nBoard migration summary");
  console.log(`  mode:              ${apply ? "APPLY" : "DRY RUN"}`);
  console.log(`  legacy/incomplete: ${stats.scanned}`);
  console.log(`  ${apply ? "migrated" : "planned"}:          ${apply ? stats.migrated : stats.planned}`);
  console.log(`  conflicts:         ${stats.conflicts}`);
  console.log(`  invalid workspace: ${stats.invalidWorkspace}`);
  console.log(`  missing workspace: ${stats.missingWorkspace}`);
  console.log(`  missing owner:     ${stats.missingOwner}`);
  console.log(`  errors:            ${stats.errors}`);

  if (!apply && stats.planned > 0) {
    console.log("\nNo changes written. Re-run with --apply to migrate these boards.");
  }

  if (stats.conflicts || stats.invalidWorkspace || stats.missingWorkspace || stats.errors) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("Migration crashed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
