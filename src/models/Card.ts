import { Schema, model, Document, Types } from "mongoose";
import { isValidDateString } from "../utils/dates";
export { isValidDateString };

export type CardSource = "manual" | "ai";

export interface ICard extends Document {
  board: Types.ObjectId;
  list: Types.ObjectId;
  workspace: Types.ObjectId;
  title: string;
  description: string;
  dueDate: string | null;
  assignee: Types.ObjectId | null;
  position: number;
  createdBy: Types.ObjectId;
  createdVia: CardSource;
  aiBatchId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const cardSchema = new Schema<ICard>(
  {
    // workspace, board and list are always set by the SERVICE from the parent
    // document. They are never taken from the request body.
    board: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: [true, "Board is required"],
    },
    list: {
      type: Schema.Types.ObjectId,
      ref: "List",
      required: [true, "List is required"],
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace is required"],
    },
    title: {
      type: String,
      required: [true, "Card title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [200, "Title must be at most 200 characters"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [5000, "Description must be at most 5000 characters"],
    },
    // A calendar day, not a moment in time, so it is stored as text (see schema.md section 12)
    dueDate: {
      type: String,
      default: null,
      validate: {
        validator: (value: string | null) => value === null || isValidDateString(value),
        message: "Due date must be a real date in YYYY-MM-DD format",
      },
    },
    // The service checks that this person is a member of the card's workspace.
    // The database cannot enforce that.
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    position: {
      type: Number,
      required: [true, "Position is required"],
      default: 1024,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    createdVia: {
      type: String,
      enum: ["manual", "ai"],
      default: "manual",
    },
    aiBatchId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// A column in order
cardSchema.index({ list: 1, position: 1 });
// Loading a whole board
cardSchema.index({ board: 1 });
// "My cards", sorted by due date
cardSchema.index({ assignee: 1, dueDate: 1 });
// Overdue and due-today checks on a board
cardSchema.index({ board: 1, dueDate: 1 });
// Admin statistics: cards created this week
cardSchema.index({ createdAt: -1 });
// "Was this AI batch already added to this board?" (BATCH_ALREADY_ADDED)
cardSchema.index({ board: 1, aiBatchId: 1 }, { sparse: true });

cardSchema.set("toJSON", {
  versionKey: false,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret as unknown as Record<string, unknown> & { _id: unknown };
    return { id: String(_id), ...rest };
  },
});

export const Card = model<ICard>("Card", cardSchema);