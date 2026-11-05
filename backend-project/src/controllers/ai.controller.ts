import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import { runBreakdown } from "../services/ai.service";
import { loadBoardContext } from "../services/aiBoardContext";
import { getUsage } from "../services/aiUsage.service";
import type { BreakdownBody } from "../schemas/ai.schema";

export const breakdown = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new HttpError(401, "UNAUTHORIZED", "Please sign in to continue");

  const { goal, deadline } = req.body as BreakdownBody;

  // Membership is checked BEFORE a slot is taken or the AI is called
  const context = await loadBoardContext(String(req.params.boardId), user.id);

  const result = await runBreakdown({
    userId: user.id,
    boardId: context.boardId,
    workspaceId: context.workspaceId,
    lists: context.lists,
    goal,
    deadline: deadline ?? null,
  });

  res.json(result);
});

export const usage = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new HttpError(401, "UNAUTHORIZED", "Please sign in to continue");

  res.json(await getUsage(user.id));
});
