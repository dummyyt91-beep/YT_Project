import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/User";
import { getTokenFromRequest, verifyAuthToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    if (!token) return NextResponse.json({ user: null }, { status: 401 });
    const payload = verifyAuthToken(token);
    if (!payload) return NextResponse.json({ user: null }, { status: 401 });

    await connectDB();

    const user = await User.findById(payload.userId);
    if (!user) return NextResponse.json({ user: null }, { status: 401 });

    // Daily reset logic
    const today = new Date().toDateString();
    if (user.lastUsedDate !== today) {
      user.lastUsedDate = today;
      if (user.plan === "free") user.attemptsRemaining = 5;
      else if (user.plan === "pro") user.attemptsRemaining = 100;
      await user.save();
    }

    return NextResponse.json({
      user: {
        id: String(user._id),
        username: user.username,
        plan: user.plan,
        attemptsRemaining: user.attemptsRemaining,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed" },
      { status: 500 }
    );
  }
}
