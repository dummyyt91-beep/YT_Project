import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { Message } from "@/models/Message";
import { Collection } from "@/models/Collection";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token && verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    
    // Verify the collection exists and belongs to the user
    const collection = await Collection.findOne({
      _id: params.id,
      userId: payload.userId,
    });

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }
    
    const messages = await Message.find({ collectionId: params.id }).sort({
      timestamp: 1,
    });
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token && verifyAuthToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, content } = await request.json();

    if (!role || !content) {
      return NextResponse.json(
        { error: "Role and content are required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the collection exists and belongs to the user
    const collection = await Collection.findById(params.id);
    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    if (collection.userId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the message
    const message = await Message.create({
      collectionId: params.id,
      userId: payload.userId,
      role,
      content,
      timestamp: new Date(),
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    console.error("Message creation error:", error);
    return NextResponse.json(
      { error: "Failed to create message" },
      { status: 500 }
    );
  }
}
