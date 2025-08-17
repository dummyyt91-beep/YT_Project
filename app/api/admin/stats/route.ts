import { connectDB } from "@/lib/mongoose";
import { getTokenFromRequest, verifyAuthToken } from "@/lib/auth";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { Collection } from "@/models/Collection";
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
    if (payload.userId === "admin-id" && payload.username === "admin@gmail.com") {
      requester = { role: "admin", username: "admin@gmail.com" }; // Mock admin user for direct token authentication
    } else {
      await connectDB();
      requester = await User.findById(payload.userId);
    }

    if (!isAdmin(requester)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    // Total Users by Plan
    const usersByPlan = await User.aggregate([
      { $group: { _id: "$plan", count: { $sum: 1 } } },
    ]);
    const planDistribution = usersByPlan.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Monthly Revenue
    const monthlyRevenue = await Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          totalAmount: { $sum: "$amount" },
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Transcripts created over time (e.g., daily or monthly)
    const transcriptsOverTime = await Collection.aggregate([
      { $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } },
          count: { $sum: 1 },
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    return NextResponse.json({
      planDistribution,
      monthlyRevenue,
      transcriptsOverTime,
    });
  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}