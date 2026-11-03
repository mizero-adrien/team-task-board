import { Schema, model, Document, Types } from "mongoose";
import { isValidDateString } from "../utils/dates";
import { jsonWithId } from "../utils/schemaOptions";

export interface IAiUsage extends Document {
  user: Types.ObjectId;
  date: string;
  count: number;
  expireAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

const aiUsageSchema = new Schema<IAiUsage>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    // The day in the app time zone, as YYYY-MM-DD (see todayString in utils/dates.ts)
    date: {
      type: String,
      required: [true, "Date is required"],
      validate: {
        validator: isValidDateString,
        message: "Date must be a real date in YYYY-MM-DD format",
      },
    },
    count: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Count cannot be negative"],
    },
    expireAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + SIXTY_DAYS_MS),
    },
  },
  { timestamps: true }
);

// One document per user per day. This UNIQUE index is what makes the daily limit safe:
// see the atomic update described in docs/schema.md section 5.10.
aiUsageSchema.index({ user: 1, date: 1 }, { unique: true });

// MongoDB deletes each document once expireAt has passed
aiUsageSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });

aiUsageSchema.set("toJSON", jsonWithId);

export const AiUsage = model<IAiUsage>("AiUsage", aiUsageSchema);
