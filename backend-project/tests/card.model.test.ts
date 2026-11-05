import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { Types } from "mongoose";
import { Card } from "../src/models/Card";

const objectId = () => new Types.ObjectId();

function validCard(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    board: objectId(),
    list: objectId(),
    workspace: objectId(),
    title: "Design homepage",
    createdBy: objectId(),
    ...overrides,
  };
}

function isValidationErrorFor(field: string) {
  return (error: unknown) => {
    const validationError = error as {
      name?: string;
      errors?: Record<string, unknown>;
    };
    return (
      validationError.name === "ValidationError" &&
      validationError.errors !== undefined &&
      field in validationError.errors
    );
  };
}

describe("Card model", () => {
  test("accepts a valid card and applies defaults", async () => {
    const card = new Card(validCard());
    await card.validate();

    assert.equal(card.description, "");
    assert.equal(card.dueDate, null);
    assert.equal(card.assignee, null);
    assert.equal(card.position, 1024);
    assert.equal(card.createdVia, "manual");
    assert.equal(card.aiBatchId, null);
  });

  test("requires board, list, workspace, title and createdBy", async () => {
    for (const field of ["board", "list", "workspace", "title", "createdBy"]) {
      const data = validCard();
      delete data[field];

      await assert.rejects(() => new Card(data).validate(), isValidationErrorFor(field));
    }
  });

  test("trims title and description", async () => {
    const card = new Card(
      validCard({ title: "  Design homepage  ", description: "  Update the hero  " })
    );
    await card.validate();

    assert.equal(card.title, "Design homepage");
    assert.equal(card.description, "Update the hero");
  });

  test("rejects an empty title", async () => {
    await assert.rejects(
      () => new Card(validCard({ title: "   " })).validate(),
      isValidationErrorFor("title")
    );
  });

  test("rejects a title longer than 200 characters", async () => {
    await assert.rejects(
      () => new Card(validCard({ title: "x".repeat(201) })).validate(),
      isValidationErrorFor("title")
    );
  });

  test("accepts a title of exactly 200 characters", async () => {
    const card = new Card(validCard({ title: "x".repeat(200) }));
    await card.validate();

    assert.equal(card.title.length, 200);
  });

  test("rejects a description longer than 5000 characters", async () => {
    await assert.rejects(
      () => new Card(validCard({ description: "x".repeat(5001) })).validate(),
      isValidationErrorFor("description")
    );
  });

  test("accepts a real calendar date for dueDate", async () => {
    const card = new Card(validCard({ dueDate: "2026-02-28" }));
    await card.validate();

    assert.equal(card.dueDate, "2026-02-28");
  });

  test("accepts null dueDate", async () => {
    const card = new Card(validCard({ dueDate: null }));
    await card.validate();

    assert.equal(card.dueDate, null);
  });

  test("rejects an impossible calendar date", async () => {
    await assert.rejects(
      () => new Card(validCard({ dueDate: "2026-02-31" })).validate(),
      isValidationErrorFor("dueDate")
    );
  });

  test("rejects a dueDate in the wrong format", async () => {
    await assert.rejects(
      () => new Card(validCard({ dueDate: "28/02/2026" })).validate(),
      isValidationErrorFor("dueDate")
    );
  });

  test("rejects an unknown createdVia value", async () => {
    await assert.rejects(
      () => new Card(validCard({ createdVia: "import" })).validate(),
      isValidationErrorFor("createdVia")
    );
  });

  test("accepts a custom position", async () => {
    const card = new Card(validCard({ position: 2048 }));
    await card.validate();

    assert.equal(card.position, 2048);
  });

  test("toJSON returns id and removes _id and __v", () => {
    const card = new Card(validCard());
    const json = card.toJSON() as unknown as Record<string, unknown>;

    assert.equal(json.id, String(card._id));
    assert.equal("_id" in json, false);
    assert.equal("__v" in json, false);
    assert.equal(json.title, "Design homepage");
  });

  test("declares the expected indexes", () => {
    const indexes = Card.schema.indexes().map(([fields]) => fields);

    const expected = [
      { list: 1, position: 1 },
      { board: 1 },
      { assignee: 1, dueDate: 1 },
      { board: 1, dueDate: 1 },
      { createdAt: -1 },
      { board: 1, aiBatchId: 1 },
    ];

    for (const index of expected) {
      assert.ok(
        indexes.some((candidate) => JSON.stringify(candidate) === JSON.stringify(index)),
        `missing index ${JSON.stringify(index)}`
      );
    }
  });

  test("enables timestamps", () => {
    assert.equal(Card.schema.get("timestamps"), true);
  });
});
