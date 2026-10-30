import { Schema, model, Document, Types } from "mongoose";
import bcrypt from "bcryptjs";

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  blocked: boolean;
  blockReason?: string;
  blockedAt?: Date;
  blockedBy?: Types.ObjectId;
  passwordChangedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name must be at most 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Enter a valid email address"],
    },
    // select: false means queries do NOT return the password unless you ask for it
    // with .select("+password"). Only the login code should ever do that.
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    blocked: { type: Boolean, default: false },
    blockReason: {
      type: String,
      trim: true,
      minlength: [3, "Block reason must be at least 3 characters"],
      maxlength: [300, "Block reason must be at most 300 characters"],
      required: [
        function (this: IUser) {
          return this.blocked;
        },
        "A reason is required when blocking an account",
      ],
    },
    blockedAt: { type: Date },
    blockedBy: { type: Schema.Types.ObjectId, ref: "User" },
    passwordChangedAt: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Hash the password whenever it is new or changed
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  // A brand new account has no "previous" password, so only record real changes.
  // The auth middleware uses this to reject tokens issued before the change.
  if (!this.isNew) {
    this.passwordChangedAt = new Date();
  }
});

// The password is select:false, so load it first: User.findOne({ email }).select("+password")
userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// What leaves the server: "id" instead of "_id", and nothing secret
userSchema.set("toJSON", {
  transform: (_doc, ret: any) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    delete ret.resetPasswordToken;
    delete ret.resetPasswordExpires;
    return ret;
  },
});

userSchema.index({ createdAt: -1 });
userSchema.index({ resetPasswordToken: 1 }, { sparse: true });

export const User = model<IUser>("User", userSchema);