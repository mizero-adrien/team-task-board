import { asyncHandler } from "../utils/asyncHandler";
import { requireUser } from "../utils/requireUser";
import { parseLimit } from "../services/activity.service";
import * as boardService from "../services/board.service";
import type { CreateBoardBody, UpdateBoardBody } from "../schemas/board.schema";

export const createBoard = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const board = await boardService.createBoard(
    String(req.params.workspaceId),
    user,
    req.body as CreateBoardBody
  );
  res.status(201).json(board);
});

export const listBoards = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  res.json(await boardService.listBoards(String(req.params.workspaceId), user.id));
});

export const getBoard = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  res.json(await boardService.getBoardView(String(req.params.boardId), user.id));
});

export const updateBoard = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  res.json(
    await boardService.updateBoard(
      String(req.params.boardId),
      user,
      req.body as UpdateBoardBody
    )
  );
});

export const deleteBoard = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  await boardService.deleteBoard(String(req.params.boardId), user);
  res.status(204).send();
});

export const getActivity = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const before = typeof req.query.before === "string" ? req.query.before : undefined;

  res.json(
    await boardService.getBoardActivity(String(req.params.boardId), user.id, {
      limit: parseLimit(req.query.limit),
      before,
    })
  );
});
