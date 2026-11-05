import { Schema, model, Document, Types } from 'mongoose';

// 1. TypeScript interface for the workspace membership document
export interface IWorkspaceMember extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: 'owner' | 'member';
  joinedAt: Date;
}

// 2. Mongoose schema
const workspaceMemberSchema = new Schema<IWorkspaceMember>({
  workspaceId: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['owner', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
});

// 3. One membership per user per workspace
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

// 4. Export the model
export const WorkspaceMember = model<IWorkspaceMember>(
  'WorkspaceMember',
  workspaceMemberSchema
);
