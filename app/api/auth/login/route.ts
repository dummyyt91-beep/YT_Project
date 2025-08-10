import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/User";
import { signAuthToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = signAuthToken({
      userId: String(user._id),
      username: user.username,
      plan: user.plan,
    });
    const res = NextResponse.json({
      user: {
        id: String(user._id),
        username: user.username,
        email: user.email,
        plan: user.plan,
        attemptsRemaining: user.attemptsRemaining,
      },
    });
    res.cookies.set("auth", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  } catch (error: any) {
    console.error("Login error:", error);

    // Provide user-friendly error messages
    let userMessage = "Something went wrong. Please try again.";
    let statusCode = 500;

    if (error.message.includes("Unable to connect to database")) {
      userMessage =
        "We're experiencing technical difficulties. Please try again in a few minutes.";
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes("ECONNREFUSED")) {
      userMessage =
        "We're experiencing technical difficulties. Please try again in a few minutes.";
      statusCode = 503;
    }

    return NextResponse.json({ error: userMessage }, { status: statusCode });
  }
}
