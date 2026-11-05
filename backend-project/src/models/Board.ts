import { Schema, model, Document, Types, HydratedDocument } from "mongoose";
import { jsonWithId } from "../utils/schemaOptions";

export interface IBoard extends Document {
  workspace: Types.ObjectId;
  name: string;
  description: string | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type BoardDocument = HydratedDocument<IBoard>;

const boardSchema = new Schema<IBoard>(
  {
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace is required"],
    },
    name: {
      type: String,
      required: [true, "Board name is required"],
      trim: true,
      minlength: [1, "Board name cannot be empty"],
      maxlength: [80, "Board name must be at most 80 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description must be at most 500 characters"],
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
  },
  { timestamps: true }
);

boardSchema.index({ workspace: 1, createdAt: -1 });

boardSchema.set("toJSON", jsonWithId);

export const Board = model<IBoard>("Board", boardSchema);
