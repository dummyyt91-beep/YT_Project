import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/User";
import { signAuthToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { username, password, email } = await request.json();
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectDB();

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }
    if (username) {
      const existingByUsername = await User.findOne({ username });
      if (existingByUsername) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const today = new Date().toDateString();
    const user = await User.create({
      username: username || email.split("@")[0],
      email,
      passwordHash,
      plan: "free",
      attemptsRemaining: 5,
      lastUsedDate: today,
    });

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
    console.error("Registration error:", error);

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
    } else if (error.message.includes("duplicate key error")) {
      userMessage = "An account with this email or username already exists.";
      statusCode = 409;
    }

    return NextResponse.json({ error: userMessage }, { status: statusCode });
  }
}
