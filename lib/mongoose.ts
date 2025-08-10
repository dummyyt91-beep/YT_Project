import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://dummyyt91:zFWHrkEm38kn4rmY@youtube.rrmmcrs.mongodb.net/test?retryWrites=true&w=majority";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose || {
  conn: null,
  promise: null,
};

if (!global._mongoose) {
  global._mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log("Using cached database connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("Creating new database connection...");
    const opts = {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB || "test",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).catch((err) => {
      console.error("MongoDB connection error:", err);
      throw new Error("Unable to connect to database. Please try again later.");
    });
  }

  try {
    console.log("Waiting for database connection...");
    cached.conn = await cached.promise;
    console.log("Database connected successfully");
    return cached.conn;
  } catch (error) {
    console.error("Database connection failed:", error);
    cached.promise = null;
    throw error;
  }
}

export default connectDB;
