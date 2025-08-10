import { Schema, model, models, type Model, Types } from "mongoose";

export interface MessageDocument {
  _id: any;
  collectionId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const MessageSchema = new Schema<MessageDocument>({
  collectionId: {
    type: Schema.Types.ObjectId,
    ref: "Collection",
    required: true,
    index: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ["user", "assistant"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Add pre-save middleware for debugging
MessageSchema.pre("save", function (next) {
  console.log("Saving message:", {
    collectionId: this.collectionId,
    userId: this.userId,
    role: this.role,
    contentLength: this.content?.length,
    timestamp: this.timestamp,
  });
  next();
});

export const Message: Model<MessageDocument> =
  models.Message || model<MessageDocument>("Message", MessageSchema);
