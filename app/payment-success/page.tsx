"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

// ----------------------
// Inner content component
// ----------------------
function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState("");

  const verificationRef = useRef({
    attempted: false,
    inProgress: false,
    sessionId: null as string | null,
  });

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    const plan = searchParams.get("plan");

    if (!sessionId || !plan) {
      setError("Invalid payment session");
      setIsProcessing(false);
      return;
    }

    // check localStorage first
    try {
      const verifiedSessions = JSON.parse(
        localStorage.getItem("verifiedSessions") || "[]"
      );
      if (verifiedSessions.includes(sessionId)) {
        console.log(
          `[PAYMENT-SUCCESS] Session ${sessionId} already verified (from localStorage)`
        );
        setIsProcessing(false);
        return;
      }
    } catch (e) {
      console.error("Error checking localStorage:", e);
    }

    if (
      verificationRef.current.attempted ||
      verificationRef.current.sessionId === sessionId
    ) {
      console.log(
        `[PAYMENT-SUCCESS] Verification already attempted for session ${sessionId}, skipping`
      );
      return;
    }

    verificationRef.current = {
      attempted: true,
      inProgress: true,
      sessionId,
    };

    console.log(
      `[PAYMENT-SUCCESS] Starting SINGLE verification for session ${sessionId}`
    );

    const verifyPayment = async () => {
      try {
        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            plan,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to verify payment");
        }

        // persist in localStorage
        try {
          const verifiedSessions = JSON.parse(
            localStorage.getItem("verifiedSessions") || "[]"
          );
          if (!verifiedSessions.includes(sessionId)) {
            verifiedSessions.push(sessionId);
            localStorage.setItem(
              "verifiedSessions",
              JSON.stringify(verifiedSessions)
            );
          }
        } catch (e) {
          console.error("Error updating localStorage:", e);
        }

        console.log(
          `[PAYMENT-SUCCESS] Successfully verified session ${sessionId}`
        );
        setIsProcessing(false);
      } catch (error) {
        console.error("[PAYMENT-SUCCESS] Verification error:", error);
        setError(
          error instanceof Error ? error.message : "Failed to verify payment"
        );
        setIsProcessing(false);
      } finally {
        verificationRef.current.inProgress = false;
      }
    };

    verifyPayment();
  }, [searchParams]);

  // ----------------------
  // RENDER
  // ----------------------
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">
              Processing Payment...
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your subscription.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="text-red-500 mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-600">
            Payment Successful!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your subscription has been activated successfully. You can now enjoy
            all the premium features.
          </p>
          <div className="space-y-2">
            <Link href="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------
// Exported page
// ----------------------
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading payment status...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
