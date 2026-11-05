import "dotenv/config";
import { Types } from "mongoose";
import { connectDB, disconnectDB } from "../config/db";
import { Activity } from "../models/Activity";
import { Board } from "../models/Board";
import { Card } from "../models/Card";
import { Comment } from "../models/Comment";
import { List } from "../models/List";
import { User } from "../models/User";
import { WorkspaceMember } from "../models/WorkspaceMember";
import { LIMITS } from "../constants/limits";
import { addDays, todayString } from "../utils/dates";
import { HttpError } from "../utils/HttpError";
import * as boards from "../services/board.service";

let failures = 0;
function check(label: string, ok: boolean) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) failures += 1;
}

async function codeOf(action: () => Promise<unknown>): Promise<string | null> {
  try {
    await action();
    return null;
  } catch (error) {
    return error instanceof HttpError ? error.code : `OTHER: ${(error as Error).message}`;
  }
}

const stamp = Date.now();
const workspace = new Types.ObjectId();
const otherWorkspace = new Types.ObjectId();

async function makeUser(label: string) {
  const user = await User.create({
    name: `${label} Test`,
    email: `${label.toLowerCase()}-${stamp}@example.com`,
    password: "Board2026",
  });
  return { id: String(user._id), name: user.name };
}

const names = async (boardId: string) =>
  (await List.find({ boardId }).sort({ position: 1 })).map((list) => list.name);

async function main() {
  await connectDB();
  await Board.init();

  const owner = await makeUser("Owner");
  const member = await makeUser("Member");
  const stranger = await makeUser("Stranger");

  await WorkspaceMember.create({ workspaceId: workspace, userId: owner.id, role: "owner" });
  await WorkspaceMember.create({ workspaceId: workspace, userId: member.id, role: "member" });
  await WorkspaceMember.create({
    workspaceId: otherWorkspace,
    userId: owner.id,
    role: "owner",
  });

  console.log("\n--- Creating boards ---");
  const board = await boards.createBoard(String(workspace), owner, {
    name: "Launch the school website",
    description: "",
  });
  check("An empty description is stored as null", board.description === null);
  check("The board exposes workspaceId", board.workspaceId === String(workspace));
  check("A new board has To do, Doing, Done", (await names(board.id)).join() === "To do,Doing,Done");
  const done = await List.findOne({ boardId: board.id, name: "Done" });
  check(
    "Only 'Done' is marked as the finished list",
    done?.isDone === true &&
      (await List.countDocuments({ boardId: board.id, isDone: true })) === 1
  );
  check(
    "A member can create a board",
    (await boards.createBoard(String(workspace), member, { name: "Second board" })).name ===
      "Second board"
  );
  check(
    "A stranger cannot create a board (404)",
    (await codeOf(() => boards.createBoard(String(workspace), stranger, { name: "Nope" }))) ===
      "NOT_FOUND"
  );
  check(
    "A made-up workspace gives the SAME 404",
    (await codeOf(() =>
      boards.createBoard(String(new Types.ObjectId()), stranger, { name: "Nope" })
    )) === "NOT_FOUND"
  );

  const summaries = await boards.listBoards(String(workspace), member.id);
  check(
    "The board list shows both boards with 3 lists each",
    summaries.length === 2 && summaries.every((b) => b.listCount === 3)
  );

  console.log("\n--- The whole board in one request ---");
  const view0 = await boards.getBoardView(board.id, member.id);
  const [todo] = view0.lists;

  const yesterday = addDays(todayString(), -1);
  const base = { board: board.id, workspace, createdBy: owner.id };
  const lateCard = await Card.create({
    ...base,
    list: todo.id,
    title: "Late card",
    dueDate: yesterday,
    position: 1024,
    assignee: member.id,
  });
  await Card.create({
    ...base,
    list: done?._id,
    title: "Finished late",
    dueDate: yesterday,
    position: 1024,
  });
  await Card.create({ ...base, list: todo.id, title: "Second card", position: 2048 });

  const view = await boards.getBoardView(board.id, member.id);
  const late = view.cards.find((card) => card.title === "Late card");
  const finished = view.cards.find((card) => card.title === "Finished late");
  check(
    "The view has the role, members, lists and cards",
    view.role === "member" &&
      view.members.length === 2 &&
      view.lists.length === 3 &&
      view.cards.length === 3
  );
  check("An overdue card in a normal list is flagged", late?.isOverdue === true);
  check("A late card in the Done list is NOT flagged", finished?.isOverdue === false);
  check(
    "The assignee comes with a name",
    late?.assignee?.name === member.name && view.cards[0].assignee !== undefined
  );
  check(
    "Cards come in list order, then position",
    view.cards[0].title === "Late card" && view.cards[1].title === "Second card"
  );
  check(
    "A stranger cannot open the board (404)",
    (await codeOf(() => boards.getBoardView(board.id, stranger.id))) === "NOT_FOUND"
  );
  check(
    "A made-up board gives the SAME 404",
    (await codeOf(() =>
      boards.getBoardView(String(new Types.ObjectId()), stranger.id)
    )) === "NOT_FOUND"
  );

  console.log("\n--- Renaming a board and the activity feed ---");
  check(
    "A member can rename a board",
    (await boards.updateBoard(board.id, member, { name: "School website" })).name ===
      "School website"
  );
  const feed = await boards.getBoardActivity(board.id, owner.id, { limit: 100 });
  const messages = feed.items.map((item) => item.message);
  check(
    "The feed says who created the board",
    messages.some((message) => message.includes("created the board Launch the school website"))
  );
  check(
    "The feed says who renamed the board",
    messages.some((message) => message.includes("renamed the board to School website"))
  );
  check(
    "A stranger cannot read the feed (404)",
    (await codeOf(() => boards.getBoardActivity(board.id, stranger.id))) === "NOT_FOUND"
  );

  console.log("\n--- Deleting a board ---");
  await Comment.create({
    card: lateCard._id,
    board: board.id,
    workspace,
    author: member.id,
    text: "A comment",
  });
  check(
    "A member cannot delete a board (403)",
    (await codeOf(() => boards.deleteBoard(board.id, member))) === "FORBIDDEN"
  );
  await boards.deleteBoard(board.id, owner);
  const left = await Promise.all([
    Board.countDocuments({ _id: board.id }),
    List.countDocuments({ boardId: board.id }),
    Card.countDocuments({ board: board.id }),
    Comment.countDocuments({ board: board.id }),
  ]);
  check("The owner deleted the board and everything inside it", left.every((n) => n === 0));
  check(
    "The board's earlier history is kept",
    (await Activity.countDocuments({ board: board.id })) > 0
  );
  check(
    "A workspace-level 'board.deleted' was written",
    (await Activity.countDocuments({ workspace, board: null, type: "board.deleted" })) === 1
  );

  console.log("\n--- The board limit ---");
  await Board.insertMany(
    Array.from({ length: LIMITS.BOARDS_PER_WORKSPACE }, (_, index) => ({
      workspace: otherWorkspace,
      name: `Board ${index}`,
      createdBy: owner.id,
    }))
  );
  check(
    "The 51st board is refused",
    (await codeOf(() =>
      boards.createBoard(String(otherWorkspace), owner, { name: "One too many" })
    )) === "BOARD_LIMIT"
  );

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);

  const userIds = [owner.id, member.id, stranger.id];
  const spaces = [workspace, otherWorkspace];
  const boardIds = (await Board.find({ workspace: { $in: spaces } }).select("_id")).map(
    (row) => row._id
  );

  await Promise.all([
    Activity.deleteMany({ workspace: { $in: spaces } }),
    Comment.deleteMany({ workspace: { $in: spaces } }),
    Card.deleteMany({ workspace: { $in: spaces } }),
    List.deleteMany({ boardId: { $in: boardIds } }),
    Board.deleteMany({ workspace: { $in: spaces } }),
    WorkspaceMember.deleteMany({ workspaceId: { $in: spaces } }),
    User.deleteMany({ _id: { $in: userIds } }),
  ]);
}

main()
  .catch((error) => {
    console.error("Test crashed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (failures > 0) process.exitCode = 1;
    await disconnectDB();
  });
