import { z } from "zod";
import { HttpError } from "../utils/HttpError";

export type GenerateInput = { system: string; user: string };
export type GenerateFn = (input: GenerateInput) => Promise<string>;

const API_URL = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";
const MAX_OUTPUT_TOKENS = 1500;

const unavailable = () =>
  new HttpError(
    502,
    "AI_UNAVAILABLE",
    "The AI helper isn't available right now. You can still add cards by hand."
  );

export const getModelName = (): string =>
  process.env.LLM_PROVIDER === "fake" ? "fake" : (process.env.LLM_MODEL ?? "unknown");

const responseSchema = z.object({
  content: z.array(z.object({ type: z.string(), text: z.string().optional() })),
});

// Canned output for LLM_PROVIDER=fake. It contains mistakes ON PURPOSE (an unknown
// list, a past date, a far date, a duplicate) so the checking code gets exercised.
const FAKE_OUTPUT = JSON.stringify({
  cards: [
    { title: "Collect content for the homepage", description: "Get the mission, contacts and 5 photos.", list: "To do", due_in_days: 3 },
    { title: "Design the homepage layout", description: "Sketch the layout and agree on colours.", list: "Backlog", due_in_days: -2 },
    { title: "Build the pages", description: "Turn the design into working pages.", list: "Doing", due_in_days: 400 },
    { title: "collect content for the homepage", description: "A duplicate of the first card.", list: "To do", due_in_days: 5 },
  ],
});

export const generate: GenerateFn = async ({ system, user }) => {
  if (process.env.LLM_PROVIDER === "fake") return FAKE_OUTPUT;

  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!apiKey || !model) {
    console.error("AI is not configured: set LLM_API_KEY and LLM_MODEL");
    throw unavailable();
  }

  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 30_000;

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": API_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_OUTPUT_TOKENS,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    // Timeout or network failure. Only the error NAME is logged, never the request.
    console.error("AI request failed:", error instanceof Error ? error.name : "unknown error");
    throw unavailable();
  }

  if (!response.ok) {
    console.error(`AI provider answered with status ${response.status}`);
    throw unavailable();
  }

  const parsed = responseSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) {
    console.error("AI provider answered in an unexpected format");
    throw unavailable();
  }

  return parsed.data.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
};
