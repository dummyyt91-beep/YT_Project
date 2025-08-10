import { Schema, model, models, type Model, Types } from "mongoose";

export interface PaymentDocument {
  _id: any;
  userId: Types.ObjectId;
  usernameSnapshot?: string;
  plan: "pro" | "enterprise";
  amount: number; // store in paise
  currency: string;
  stripeSessionId?: string;
  stripeCustomerId?: string;
  invoiceId?: string;
  status: "completed" | "refunded" | "failed" | "pending";
  createdAt: Date;
}

const PaymentSchema = new Schema<PaymentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    usernameSnapshot: { type: String },
    plan: { type: String, enum: ["pro", "enterprise"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    stripeSessionId: { type: String },
    stripeCustomerId: { type: String },
    invoiceId: { type: String },
    status: {
      type: String,
      enum: ["completed", "refunded", "failed", "pending"],
      default: "completed",
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Payment: Model<PaymentDocument> =
  models.Payment || model<PaymentDocument>("Payment", PaymentSchema);
