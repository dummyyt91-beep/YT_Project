import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { Collection } from "@/models/Collection";

export async function GET(request: NextRequest) {
  const token = getTokenFromRequest(request);
  const payload = token && verifyAuthToken(token);
  if (!payload) return NextResponse.json({ collections: [] }, { status: 401 });
  await connectDB();
  const collections = await Collection.find({ userId: payload.userId }).sort({
    createdAt: -1,
  });
  return NextResponse.json({ collections });
}

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token && verifyAuthToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { youtubeUrl, transcript, title } = await request.json();

    if (!youtubeUrl || !transcript) {
      return NextResponse.json(
        { error: "YouTube URL and transcript are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Extract video ID from YouTube URL
    const videoIdMatch = youtubeUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    );
    const videoId = videoIdMatch ? videoIdMatch[1] : null;

    // Create new collection
    const collection = await Collection.create({
      userId: payload.userId,
      youtubeUrl,
      videoId,
      transcript,
      title: title || 'YouTube Video',
    });

    return NextResponse.json({ collection }, { status: 201 });
  } catch (error: any) {
    console.error("Collection creation error:", error);
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }
}
