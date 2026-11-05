import { Schema, model, Types, HydratedDocument } from "mongoose";

export interface IBoard {
  workspaceId: Types.ObjectId;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type BoardDocument = HydratedDocument<IBoard>;

const boardSchema = new Schema<IBoard>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "workspaceId is required"],
    },
    name: {
      type: String,
      required: [true, "Board name is required"],
      trim: true,
      maxlength: [80, "Board name cannot exceed 80 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: null, // nullable
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// "List the boards of a workspace" is the main query, so index it.
boardSchema.index({ workspaceId: 1, createdAt: -1 });

export const Board = model<IBoard>("Board", boardSchema);