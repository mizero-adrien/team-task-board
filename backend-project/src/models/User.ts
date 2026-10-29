import { Schema, model, Document } from 'mongoose';

// 1. Create a TypeScript interface based on your required fields
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional in TS because we will hide it from responses
  role: 'user' | 'admin';
  isBlocked: boolean;
  blockReason?: string | null;
  lastLoginAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Mongoose Schema
const userSchema = new Schema<IUser>(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true 
    },
    password: { 
      type: String, 
      required: true, 
      select: false // <-- This hides the password by default in database queries!
    },
    role: { 
      type: String, 
      enum: ['user', 'admin'], 
      default: 'user' 
    },
    isBlocked: { 
      type: Boolean, 
      default: false 
    },
    blockReason: { 
      type: String, 
      default: null 
    },
    lastLoginAt: { 
      type: Date, 
      default: null 
    }
  },
  { 
    // This automatically handles createdAt and updatedAt for you
    timestamps: true 
  }
);

// 3. Export the model so we can use it in our controllers/services
export const User = model<IUser>('User', userSchema);