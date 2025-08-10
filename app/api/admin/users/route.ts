import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { User } from "@/models/User";

function isAdmin(user: any): boolean {
  return user?.role === "admin" || user?.username === "Shrushti.vachhani";
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token && verifyAuthToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const requester = await User.findById(payload.userId);
    if (!isAdmin(requester))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await User.find({}).sort({ createdAt: -1 });
    const result = users.map((u) => ({
      id: String(u._id),
      username: u.username,
      email: u.email,
      plan: u.plan,
      attemptsRemaining: u.attemptsRemaining,
      createdAt: u.createdAt,
      subscriptionDate: u.subscriptionDate,
    }));
    return NextResponse.json({ users: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed" },
      { status: 500 }
    );
  }
}
