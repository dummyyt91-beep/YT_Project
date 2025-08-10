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
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature")!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId) {
          await connectDB();
          const user = await User.findById(userId);
          if (user) {
            const plan =
              (session.metadata?.plan as "pro" | "enterprise") || "pro";
            user.plan = plan;
            user.attemptsRemaining = plan === "pro" ? 100 : 999;
            if (session.customer && typeof session.customer === "string") {
              user.stripeCustomerId = session.customer;
            }
            user.subscriptionDate = new Date();
            await user.save();

            await Payment.create({
              userId: user._id,
              usernameSnapshot: user.username,
              plan,
              amount: plan === "pro" ? 9900 : 99900,
              currency: "INR",
              stripeSessionId: session.id,
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : undefined,
              status: "completed",
            });
          }
        }
        break;

      case "customer.subscription.updated":
        // Handle subscription updates
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
