import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/mongoose";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { getTokenFromRequest, verifyAuthToken } from "@/lib/auth";

// STRICT: Track payment verification requests to detect duplicates
// This Set persists for the lifetime of the server instance
const processedSessions = new Set();

// STRICT: Track in-progress verifications to prevent concurrent processing of the same session
const inProgressVerifications = new Map();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export async function POST(request: NextRequest) {
  try {
    console.log("[PAYMENT-VERIFY] Starting payment verification process");
    
    // Verify user authentication
    const token = getTokenFromRequest(request);
    const payload = token && verifyAuthToken(token);
    if (!payload) {
      console.log("[PAYMENT-VERIFY] Unauthorized request");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get session ID and plan from request body
    const { sessionId, plan } = await request.json();
    console.log(`[PAYMENT-VERIFY] Processing session: ${sessionId}, plan: ${plan}`);

    // STRICT: Check if this session has already been processed in this server instance
    if (processedSessions.has(sessionId)) {
      console.log(`[PAYMENT-VERIFY] Session ${sessionId} already processed in this server instance, preventing duplicate`);
      return NextResponse.json({
        success: true,
        message: "Payment already verified",
      });
    }
    
    // STRICT: Check if this session is currently being processed by another request
    if (inProgressVerifications.has(sessionId)) {
      const processingStartTime = inProgressVerifications.get(sessionId);
      const processingTimeMs = Date.now() - processingStartTime;
      
      console.log(`[PAYMENT-VERIFY] Session ${sessionId} is currently being processed by another request (${processingTimeMs}ms in progress)`);
      
      // If processing has been going on for more than 30 seconds, assume it's stuck and allow this request to proceed
      if (processingTimeMs < 30000) {
        return NextResponse.json({
          success: true,
          message: "Payment verification in progress",
        });
      }
      
      console.log(`[PAYMENT-VERIFY] Previous verification attempt for ${sessionId} appears stuck, allowing this request to proceed`);
      // Continue processing if the previous attempt appears stuck
    }

    if (!sessionId || !plan) {
      console.log("[PAYMENT-VERIFY] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // STRICT: Mark this session as in-progress with timestamp
    inProgressVerifications.set(sessionId, Date.now());

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify the payment status
    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();

    // Find the user
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update user's plan and attempts
    user.plan = plan as "pro" | "enterprise";
    user.attemptsRemaining = plan === "pro" ? 100 : 999;
    if (session.customer && typeof session.customer === "string") {
      user.stripeCustomerId = session.customer;
    }
    user.subscriptionDate = new Date();
    await user.save();

    // STRICT: Double-check if payment record already exists for this session
    const existingPayment = await Payment.findOne({ stripeSessionId: session.id });
    console.log(`[PAYMENT-VERIFY] Existing payment check for session ${session.id}: ${existingPayment ? 'FOUND' : 'NOT FOUND'}`);
    
    // Only create a payment record if one doesn't already exist
    if (!existingPayment) {
      try {
        console.log(`[PAYMENT-VERIFY] Creating new payment record for session ${session.id}`);
        
        // STRICT: Use findOneAndUpdate with upsert to ensure atomicity
        // This creates the document only if it doesn't exist, preventing race conditions
        const result = await Payment.findOneAndUpdate(
          { stripeSessionId: session.id },
          {
            userId: user._id,
            usernameSnapshot: user.username,
            plan,
            amount: plan === "pro" ? 9900 : 99900,
            currency: "INR",
            stripeSessionId: session.id,
            stripeCustomerId:
              typeof session.customer === "string" ? session.customer : undefined,
            status: "completed",
          },
          { upsert: true, new: true, runValidators: true }
        );
        
        console.log(`[PAYMENT-VERIFY] Payment record created/updated: ${result._id}`);
      } catch (error) {
        // If error is a duplicate key error, it means another request created the payment
        if (error.code === 11000) {
          console.log(`[PAYMENT-VERIFY] Another process already created payment for session ${session.id}`);
        } else {
          throw error; // Re-throw if it's not a duplicate key error
        }
      }
      
      // Add to processed sessions set to prevent duplicate processing in this server instance
      processedSessions.add(sessionId);
      console.log(`[PAYMENT-VERIFY] Added session ${sessionId} to processed sessions set`);
    } else {
      console.log(`[PAYMENT-VERIFY] Skipping payment creation for existing session ${session.id}`);
      // Still add to processed sessions to prevent future attempts
      processedSessions.add(sessionId);
    }

    // STRICT: Remove from in-progress verifications
    inProgressVerifications.delete(sessionId);
    
    console.log(`[PAYMENT-VERIFY] Successfully completed verification for session ${sessionId}`);
    return NextResponse.json({
      success: true,
      message: "Payment verified and user plan updated",
    });
  } catch (error: any) {
    console.error("[PAYMENT-VERIFY] Error:", error);
    
    // STRICT: Clean up in-progress verification on error
    if (sessionId) {
      inProgressVerifications.delete(sessionId);
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}