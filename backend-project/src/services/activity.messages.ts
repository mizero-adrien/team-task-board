import type { ActivityType } from "../models/Activity";

type Meta = Record<string, unknown>;

// A missing or non-text value falls back, so a message is never "undefined"
const text = (value: unknown, fallback = "an item"): string =>
  typeof value === "string" && value.trim() ? value : fallback;

const MESSAGES: Record<ActivityType, (actor: string, meta: Meta) => string> = {
  "workspace.created": (actor) => `${actor} created the workspace`,
  "member.joined": (actor) => `${actor} joined the workspace`,
  "member.removed": (actor, m) => `${actor} removed ${text(m.memberName, "a member")}`,

  "board.created": (actor, m) => `${actor} created the board ${text(m.boardName)}`,
  "board.renamed": (actor, m) => `${actor} renamed the board to ${text(m.to)}`,
  "board.deleted": (actor, m) => `${actor} deleted the board ${text(m.boardName)}`,

  "list.created": (actor, m) => `${actor} added the list ${text(m.listName)}`,
  "list.renamed": (actor, m) => `${actor} renamed ${text(m.from)} to ${text(m.to)}`,
  "list.reordered": (actor, m) => `${actor} moved the list ${text(m.listName)}`,
  "list.deleted": (actor, m) => `${actor} deleted the list ${text(m.listName)}`,

  "card.created": (actor, m) => `${actor} added ${text(m.cardTitle)} to ${text(m.listName)}`,
  "card.updated": (actor, m) => `${actor} updated ${text(m.cardTitle)}`,
  "card.moved": (actor, m) =>
    `${actor} moved ${text(m.cardTitle)} from ${text(m.fromList)} to ${text(m.toList)}`,
  "card.assigned": (actor, m) =>
    `${actor} assigned ${text(m.cardTitle)} to ${text(m.assigneeName, "someone")}`,
  "card.unassigned": (actor, m) =>
    `${actor} unassigned ${text(m.assigneeName, "someone")} from ${text(m.cardTitle)}`,
  "card.deleted": (actor, m) => `${actor} deleted ${text(m.cardTitle)}`,

  "comment.added": (actor, m) => `${actor} commented on ${text(m.cardTitle)}`,
  "comment.deleted": (actor, m) => `${actor} deleted a comment on ${text(m.cardTitle)}`,
};

export function activityMessage(type: ActivityType, actorName: string, meta?: Meta): string {
  return MESSAGES[type](actorName, meta ?? {});
}