import { randomBytes } from "crypto";
import { AiRequest, type AiRequestStatus } from "../models/AiRequest";
import { generate as callLlm, getModelName, type GenerateFn } from "../ai/llmClient";
import { buildUserPrompt, PROMPT_VERSION, SYSTEM_PROMPT } from "../ai/prompt";
import {
  AiOutputError,
  notesFromFixes,
  parseSuggestions,
  type ListRef,
  type ParseResult,
  type Suggestion,
} from "../ai/parseOutput";
import { refundSlot, reserveSlot, type Usage } from "./aiUsage.service";
import { todayString } from "../utils/dates";
import { HttpError } from "../utils/HttpError";

export type BreakdownInput = {
  userId: string;
  boardId: string;
  workspaceId: string;
  lists: ListRef[]; // in board order. The first one is the fallback list.
  goal: string;
  deadline: string | null;
};

export type BreakdownResult = {
  batchId: string;
  suggestions: Suggestion[];
  notes: string[];
  usage: Usage;
};

const MAX_ATTEMPTS = 2;

// Writes the log row for the team's test notes. It never throws.
async function logRequest(
  input: BreakdownInput,
  data: { status: AiRequestStatus; startedAt: number; result?: ParseResult }
): Promise<void> {
  try {
    await AiRequest.create({
      user: input.userId,
      board: input.boardId,
      workspace: input.workspaceId,
      goal: input.goal,
      deadline: input.deadline,
      status: data.status,
      cardsReturned: data.result?.returned ?? null,
      cardsKept: data.result?.suggestions.length ?? null,
      fixes: data.result ? [...new Set(data.result.fixes)] : [],
      model: getModelName(),
      promptVersion: PROMPT_VERSION,
      latencyMs: Date.now() - data.startedAt,
    });
  } catch (error) {
    console.error("Could not log the AI request:", error instanceof Error ? error.message : error);
  }
}

// This function NEVER writes cards. It only returns suggestions.
export async function runBreakdown(
  input: BreakdownInput,
  deps: { generate?: GenerateFn } = {}
): Promise<BreakdownResult> {
  const generate = deps.generate ?? callLlm;
  const today = todayString();
  const startedAt = Date.now();

  // 1. Take a slot. Over the limit: 429, and the provider is never called.
  let usage: Usage;
  try {
    usage = await reserveSlot(input.userId, today);
  } catch (error) {
    if (error instanceof HttpError && error.code === "AI_LIMIT_REACHED") {
      await logRequest(input, { status: "limit_reached", startedAt });
    }
    throw error;
  }

  const system = SYSTEM_PROMPT;
  const user = buildUserPrompt({
    goal: input.goal,
    today,
    deadline: input.deadline,
    listNames: input.lists.map((list) => list.name),
  });

  try {
    // 2. Ask the AI. If the answer is unusable, try ONE more time.
    let result: ParseResult | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS && !result; attempt += 1) {
      const text = await generate({ system, user }); // provider failures throw 502 here

      try {
        result = parseSuggestions(text, { today, deadline: input.deadline, lists: input.lists });
      } catch (error) {
        if (!(error instanceof AiOutputError)) throw error;
        console.error(`AI output was unusable (attempt ${attempt}): ${error.message}`);
      }
    }

    if (!result) {
      throw new HttpError(
        422,
        "AI_INVALID_OUTPUT",
        "The AI gave an answer we couldn't use. Try rewording your goal."
      );
    }

    await logRequest(input, { status: "success", startedAt, result });

    const notes = notesFromFixes(result.fixes, input.lists[0].name);
    if (result.suggestions.length === 0) {
      notes.unshift("The AI couldn't find clear tasks in that goal. Try describing it in more detail.");
    }

    return {
      batchId: `b_${randomBytes(6).toString("hex")}`,
      suggestions: result.suggestions,
      notes,
      usage,
    };
  } catch (error) {
    // The failure was ours, not the user's, so it must not cost them a breakdown
    await refundSlot(input.userId, today);

    const status: AiRequestStatus =
      error instanceof HttpError && error.code === "AI_INVALID_OUTPUT"
        ? "invalid_output"
        : "provider_error";
    await logRequest(input, { status, startedAt });

    throw error;
  }
}
