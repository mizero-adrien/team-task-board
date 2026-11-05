import { Schema, model, Document, Types } from "mongoose";
import { jsonWithId } from "../utils/schemaOptions";

export interface IComment extends Document {
  card: Types.ObjectId;
  board: Types.ObjectId;
  workspace: Types.ObjectId;
  author: Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    card: {
      type: Schema.Types.ObjectId,
      ref: "Card",
      required: [true, "Card is required"],
    },
    // board and workspace are copied from the card by the SERVICE.
    // They are never taken from the request body.
    board: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: [true, "Board is required"],
    },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace is required"],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [2000, "Comment must be at most 2000 characters"],
    },
  },
  { timestamps: true }
);

// Comments on a card, oldest first
commentSchema.index({ card: 1, createdAt: 1 });

commentSchema.set("toJSON", jsonWithId);

export const Comment = model<IComment>("Comment", commentSchema);
