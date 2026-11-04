import { Schema, model, Types, HydratedDocument } from "mongoose";

// Gap between lists. Big gaps let you insert a list between two others
// later (drag-and-drop) without rewriting every list's position.
export const LIST_POSITION_STEP = 1024;

export interface IList {
  boardId: Types.ObjectId;
  name: string;
  position: number;
  isDone: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ListDocument = HydratedDocument<IList>;

const listSchema = new Schema<IList>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: [true, "boardId is required"],
    },
    name: {
      type: String,
      required: [true, "List name is required"],
      trim: true,
      maxlength: [50, "List name cannot exceed 50 characters"],
    },
    position: {
      type: Number,
      required: [true, "position is required"],
    },
    isDone: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Loading a board's lists in order is the main query.
listSchema.index({ boardId: 1, position: 1 });

export const List = model<IList>("List", listSchema);
