import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getTokenFromRequest, verifyAuthToken } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    const payload = token && verifyAuthToken(token);
    if (!payload)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { plan, userEmail } = await request.json();

    if (!plan) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Define pricing based on plan
    let priceData;
    if (plan === "pro") {
      priceData = {
        currency: "inr",
        product: process.env.STRIPE_PRO_PRODUCT_ID,
        unit_amount: 9900, // ₹99.00 in paise
        recurring: {
          interval: "month",
        },
      };
    } else if (plan === "enterprise") {
      priceData = {
        currency: "inr",
        product: process.env.STRIPE_ENTERPRISE_PRODUCT_ID,
        unit_amount: 99900, // ₹999.00 in paise
        recurring: {
          interval: "month",
        },
      };
    } else {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: priceData,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?canceled=true`,
      customer_email: userEmail,
      metadata: {
        userId: payload.userId.toString(),
        plan: plan,
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
    });
  } catch (error: any) {
    console.error("Stripe error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
