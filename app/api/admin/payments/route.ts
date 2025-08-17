import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongoose";
import { getTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";

function isAdmin(user: any): boolean {
  return user?.role === "admin" || user?.username === "admin@gmail.com";
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token && verifyAuthToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let requester;
    if (payload.userId === "admin-id" && payload.username === "admin@gmail.com") {
      requester = { role: "admin", username: "admin@gmail.com" }; // Mock admin user for direct token authentication
    } else {
      await connectDB();
      requester = await User.findById(payload.userId);
    }

    if (!isAdmin(requester))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const payments = await Payment.find({}).sort({ createdAt: -1 });
    const result = payments.map((p) => ({
      id: String(p._id),
      userId: String(p.userId),
      username: p.usernameSnapshot,
      plan: p.plan,
      amount: p.amount,
      currency: p.currency,
      stripeSessionId: p.stripeSessionId,
      status: p.status,
      createdAt: p.createdAt,
    }));
    return NextResponse.json({ payments: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed" },
      { status: 500 }
    );
  }
}
