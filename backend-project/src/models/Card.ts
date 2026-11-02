import { Schema, model, Document, Types } from "mongoose";

// 1. Create a TypeScript interface
export interface ICard extends Document {
  board: Types.ObjectId;
  list: Types.ObjectId;
  workspace: Types.ObjectId;
  title: string;
  description?: string;
  dueDate?: string | null;
  assignee?: Types.ObjectId | null;
  position: number;
  createdBy: Types.ObjectId;
  createdVia: "manual" | "ai";
  aiBatchId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Mongoose Schema
const cardSchema = new Schema<ICard>(
  {
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
      maxlength: [5000, "Description must be at most 5000 characters"],
    },
    dueDate: {
      type: String, // Stored as YYYY-MM-DD string per your API contract
      default: null,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Allow null/empty
          // Regex for YYYY-MM-DD and check if it's a real date
          const regex = /^\d{4}-\d{2}-\d{2}$/;
          if (!regex.test(v)) return false;
          const date = new Date(v);
          return date instanceof Date && !isNaN(date.getTime());
        },
        message: "Due date must be a valid date in YYYY-MM-DD format",
      },
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    position: {
      type: Number,
      required: [true, "Position is required"],
      default: 1024, // Default starting position
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
      required: true,
    },
    aiBatchId: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// 3. Add Database Indexes for Performance
// Since you will frequently query cards by board, list, and workspace
cardSchema.index({ board: 1, list: 1, position: 1 });
cardSchema.index({ workspace: 1, assignee: 1 }); // For "My Cards" page
cardSchema.index({ aiBatchId: 1 }, { sparse: true }); // For AI batch checks

// 4. Output formatting (id instead of _id)
cardSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

// 5. Export the model
export const Card = model<ICard>("Card", cardSchema);