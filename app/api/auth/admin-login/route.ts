import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/User";
import { signAuthToken } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (email === "admin@gmail.com" && password === "admin@123") {
      // For admin, we don't need to query the database, just create a token
      const token = signAuthToken({
        userId: "admin-id", // A placeholder ID for admin
        username: "admin@gmail.com",
        plan: "enterprise", // Admin can have enterprise plan or a specific admin role
      });

      const res = NextResponse.json({
        user: {
          id: "admin-id",
          username: "admin@gmail.com",
          email: "admin@gmail.com",
          plan: "enterprise",
          role: "admin",
        },
      });

      res.cookies.set("auth", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: "/",
      });

      return res;
    } else {
      return NextResponse.json(
        { error: "Invalid admin credentials" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process admin login" },
      { status: 500 }
    );
  }
}