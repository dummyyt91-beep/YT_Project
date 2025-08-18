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
    stripeSessionId: { 
      type: String,
      unique: true, // Enforce uniqueness at database level
      sparse: true, // Allow multiple null values (for backward compatibility)
    },
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

// Add index for stripeSessionId to enforce uniqueness at database level
PaymentSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });

// Add pre-save hook to log payment creation attempts
PaymentSchema.pre('save', function(next) {
  console.log(`[PAYMENT-MODEL] Attempting to save payment with session ID: ${this.stripeSessionId}`);
  next();
});

export const Payment: Model<PaymentDocument> =
  models.Payment || model<PaymentDocument>("Payment", PaymentSchema);
