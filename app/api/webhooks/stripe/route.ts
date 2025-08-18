import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  // This webhook handler is disabled as we've moved to a direct verification approach
  // to prevent duplicate payment records
  console.log("Webhook received but ignored - using direct verification instead");
  return NextResponse.json({ received: true });
}
