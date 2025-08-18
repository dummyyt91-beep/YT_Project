export const dynamic = "force-dynamic";

import { connectDB } from "@/lib/mongoose";
import { getTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { Collection } from "@/models/Collection";
import { User } from "@/models/User";
import { NextResponse } from "next/server";

function isAdmin(user: any): boolean {
  return user?.role === "admin" || user?.username === "admin@gmail.com";
}

export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token && verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let requester;
    if (
      payload.userId === "admin-id" &&
      payload.username === "admin@gmail.com"
    ) {
      requester = { role: "admin", username: "admin@gmail.com" }; // Mock admin user for direct token authentication
    } else {
      await connectDB();
      requester = await User.findById(payload.userId);
    }

    if (!isAdmin(requester)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const totalTranscripts = await Collection.countDocuments({});

    return NextResponse.json({ totalTranscripts });
  } catch (error: any) {
    console.error("Error fetching total transcripts:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch total transcripts" },
      { status: 500 }
    );
  }
}
