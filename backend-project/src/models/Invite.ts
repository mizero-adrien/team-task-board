import { Schema, model, Document, Types } from 'mongoose';

// 1. TypeScript interface for the invite document
export interface IInvite extends Document {
  workspaceId: Types.ObjectId;
  email?: string | null;
  tokenHash: string;
  maxUses: number;
  usesCount: number;
  expiresAt: Date;
  revokedAt?: Date | null;
  invitedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Mongoose schema
const inviteSchema = new Schema<IInvite>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
      trim: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    maxUses: {
      type: Number,
      default: 1,
      min: 1
    },
    usesCount: {
      type: Number,
      default: 0,
      min: 0
    },
    expiresAt: {
      type: Date,
      required: true
    },
    revokedAt: {
      type: Date,
      default: null
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// 3. Index for common lookups
inviteSchema.index({ workspaceId: 1, email: 1 });

// 4. Export the model
export const Invite = model<IInvite>('Invite', inviteSchema);
