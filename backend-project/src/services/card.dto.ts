import type { Types } from "mongoose";
import type { ICard } from "../models/Card";

export type PersonDto = { id: string; name: string };

export type CardDto = {
  id: string;
  boardId: string;
  listId: string;
  workspaceId: string;
  title: string;
  description: string;
  dueDate: string | null;
  isOverdue: boolean;
  assignee: PersonDto | null;
  position: number;
  createdBy: PersonDto | null;
  createdVia: "manual" | "ai";
  createdAt: string;
  updatedAt: string;
};

export type CardContext = {
  people: Map<string, string>;
  doneListIds: Set<string>;
  today: string;
};

function person(
  id: Types.ObjectId | null | undefined,
  people: Map<string, string>
): PersonDto | null {
  if (!id) return null;
  const key = String(id);
  const name = people.get(key);
  return name ? { id: key, name } : null;
}

export function toCardDto(card: ICard, { people, doneListIds, today }: CardContext): CardDto {
  return {
    id: String(card._id),
    boardId: String(card.board),
    listId: String(card.list),
    workspaceId: String(card.workspace),
    title: card.title,
    description: card.description,
    dueDate: card.dueDate,
    isOverdue:
      card.dueDate !== null && card.dueDate < today && !doneListIds.has(String(card.list)),
    assignee: person(card.assignee, people),
    position: card.position,
    createdBy: person(card.createdBy, people),
    createdVia: card.createdVia,
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}
