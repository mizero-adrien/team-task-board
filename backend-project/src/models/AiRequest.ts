import { Schema, model, Document, Types } from "mongoose";
import { isValidDateString } from "../utils/dates";
import { jsonWithId } from "../utils/schemaOptions";

export const AI_REQUEST_STATUSES = [
  "success",
  "provider_error",
  "invalid_output",
  "limit_reached",
] as const;

export type AiRequestStatus = (typeof AI_REQUEST_STATUSES)[number];

// "model" is a method on Mongoose's Document, so remove it before adding our
// own "model" field. The field is still stored as "model" in MongoDB.
export interface IAiRequest extends Omit<Document, "model"> {
  user: Types.ObjectId;
  board: Types.ObjectId;
  workspace: Types.ObjectId;
  goal: string;
  deadline: string | null;
  status: AiRequestStatus;
  cardsReturned: number | null;
  cardsKept: number | null;
  fixes: string[];
  model: string | null;
  promptVersion: string;
  latencyMs: number | null;
  expireAt: Date;
  createdAt: Date;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const aiRequestSchema = new Schema<IAiRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: [true, "User is required"] },
    board: { type: Schema.Types.ObjectId, ref: "Board", required: [true, "Board is required"] },
    workspace: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace is required"],
    },
    goal: {
      type: String,
      required: [true, "Goal is required"],
      trim: true,
      maxlength: [500, "Goal must be at most 500 characters"],
    },
    deadline: {
      type: String,
      default: null,
      validate: {
        validator: (value: string | null) => value === null || isValidDateString(value),
        message: "Deadline must be a real date in YYYY-MM-DD format",
      },
    },
    status: {
      type: String,
      enum: { values: AI_REQUEST_STATUSES, message: "Unknown status: {VALUE}" },
      required: [true, "Status is required"],
    },
    cardsReturned: { type: Number, min: 0, default: null },
    cardsKept: { type: Number, min: 0, default: null },
    // What the server had to correct, for example date_in_past, unknown_list, trimmed_to_10
    fixes: { type: [String], default: [] },
    model: { type: String, trim: true, default: null },
    // Bump it whenever the prompt changes, so test results can be compared
    promptVersion: {
      type: String,
      required: [true, "Prompt version is required"],
      trim: true,
    },
    latencyMs: { type: Number, min: 0, default: null },
    // The goal text can contain private details, so this log is short-lived
    expireAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + THIRTY_DAYS_MS),
    },
  },
  // Written once, when the call finishes
  { timestamps: { createdAt: true, updatedAt: false } }
);

aiRequestSchema.index({ user: 1, createdAt: -1 });
aiRequestSchema.index({ board: 1, createdAt: -1 });
aiRequestSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

aiRequestSchema.set("toJSON", jsonWithId);

export const AiRequest = model<IAiRequest>("AiRequest", aiRequestSchema);
