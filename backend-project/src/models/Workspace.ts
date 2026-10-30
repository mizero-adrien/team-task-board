import { Schema, model, Document, Types } from 'mongoose';

// 1. TypeScript interface for the workspace document
export interface IWorkspace extends Document {
  name: string;
  description?: string | null;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Mongoose schema
const workspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60
    },
    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: 300
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// 3. Export the model
export const Workspace = model<IWorkspace>('Workspace', workspaceSchema);
