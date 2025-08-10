import { Schema, model, models, type Model, Types } from "mongoose";

export interface TranscriptItem {
  text: string;
  start?: number;
  duration?: number;
}

export interface CollectionDocument {
  _id: any;
  userId: Types.ObjectId;
  youtubeUrl: string;
  videoId?: string;
  title?: string;
  transcript: TranscriptItem[];
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptItemSchema = new Schema<TranscriptItem>(
  {
    text: { type: String, required: true },
    start: { type: Number },
    duration: { type: Number },
  },
  { _id: false }
);

const CollectionSchema = new Schema<CollectionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    youtubeUrl: { type: String, required: true },
    videoId: { type: String },
    title: { type: String },
    transcript: { type: [TranscriptItemSchema], default: [] },
  },
  { timestamps: true }
);

export const Collection: Model<CollectionDocument> =
  models.Collection ||
  model<CollectionDocument>("Collection", CollectionSchema);
