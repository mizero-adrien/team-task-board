import { Schema, model, Document, Types } from "mongoose";
import { jsonWithId } from "../utils/schemaOptions";

// Must match docs/schema.md section 5.9. To add a type: change the document and this list
// in the same pull request, and tell the team.
export const ACTIVITY_TYPES = [
  "workspace.created",
  "member.joined",
  "member.removed",
  "board.created",
  "board.renamed",
  "board.deleted",
  "list.created",
  "list.renamed",
  "list.reordered",
  "list.deleted",
  "card.created",
  "card.updated",
  "card.moved",
  "card.assigned",
  "card.unassigned",
  "card.deleted",
  "comment.added",
  "comment.deleted",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface IActivity extends Document {
  workspace: Types.ObjectId;
  board: Types.ObjectId | null;
  card: Types.ObjectId | null;
  actor: Types.ObjectId;
  actorName: string;
  type: ActivityType;
  meta: Record<string, unknown>;
  createdAt: Date;
}

const MAX_META_LENGTH = 2000;

const activitySchema = new Schema<IActivity>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace is required"],
    },
    // Empty for workspace-level events such as member.joined
    board: { type: Schema.Types.ObjectId, ref: "Board", default: null },
    card: { type: Schema.Types.ObjectId, ref: "Card", default: null },
    actor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Actor is required"],
    },
    // A SNAPSHOT of the name at that moment, so history still reads well
    // after someone renames themselves
    actorName: {
      type: String,
      required: [true, "Actor name is required"],
      trim: true,
      maxlength: [100, "Actor name must be at most 100 characters"],
    },
    type: {
      type: String,
      enum: { values: ACTIVITY_TYPES, message: "Unknown activity type: {VALUE}" },
      required: [true, "Activity type is required"],
    },
    // Small object with NAMES (card title, list name), never whole documents,
    // so the history stays readable after items are renamed or deleted
    meta: {
      type: Schema.Types.Mixed,
      default: {},
      validate: {
        validator: (value: unknown) => JSON.stringify(value ?? {}).length <= MAX_META_LENGTH,
        message: `meta must be smaller than ${MAX_META_LENGTH} characters`,
      },
    },
  },
  // History is never edited, so there is no updatedAt
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Board feed and workspace feed, newest first
activitySchema.index({ board: 1, createdAt: -1 });
activitySchema.index({ workspace: 1, createdAt: -1 });

// Append-only: an existing activity can never be changed.
// Deleting stays possible, because removing a whole workspace removes its history.
activitySchema.pre("save", function () {
  if (!this.isNew) {
    throw new Error("Activity entries are append-only and cannot be edited");
  }
});

activitySchema.pre(["updateOne", "updateMany", "findOneAndUpdate", "replaceOne"], function () {
  throw new Error("Activity entries are append-only and cannot be edited");
});

activitySchema.set("toJSON", jsonWithId);

export const Activity = model<IActivity>("Activity", activitySchema);
