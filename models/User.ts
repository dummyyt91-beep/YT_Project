import { Schema, model, models, type Model } from "mongoose";

export type PlanType = "free" | "pro" | "enterprise";

export interface UserDocument {
  _id: any;
  username: string;
  email?: string;
  passwordHash: string;
  plan: PlanType;
  attemptsRemaining: number;
  lastUsedDate?: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: string;
  subscriptionDate?: Date;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    attemptsRemaining: { type: Number, default: 5 },
    lastUsedDate: { type: String },
    stripeCustomerId: { type: String },
    subscriptionId: { type: String },
    subscriptionStatus: { type: String },
    subscriptionDate: { type: Date },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true }
);

export const User: Model<UserDocument> =
  models.User || model<UserDocument>("User", UserSchema);
