"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  attempts: string;
  features: string[];
  popular: boolean;
  plan?: string;
  user?: any;
  stripePublishableKey: string;
}

export default function PricingCard({
  name,
  price,
  period,
  attempts,
  features,
  popular,
  plan,
  user,
  stripePublishableKey,
}: PricingCardProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubscribe = async () => {
    if (!plan) return;
    
    // Check if user is logged in
    if (!user) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to purchase a subscription.",
        variant: "destructive",
      });
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push("/login");
      }, 2000);
      
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: plan,
          userEmail: user?.email || `${user?.username || "user"}@example.com`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { url } = await response.json();

      // Open in new tab to avoid iframe restrictions
      window.location.assign(url);
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stripePublishableKey) {
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.async = true;
      document.body.appendChild(script);
    }
  }, [stripePublishableKey]);

  const isFree = name === "Free";
  const isCurrentPlan = user?.plan === name.toLowerCase();

  return (
    <Card className={`relative ${popular ? "border-blue-500 border-2" : ""}`}>
      {popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
          Most Popular
        </Badge>
      )}
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}</span>
          <span className="text-gray-600">{period}</span>
        </div>
        <CardDescription className="text-lg font-medium text-blue-600">
          {attempts}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 mb-6">
          {features.map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {isCurrentPlan ? (
          <Button className="w-full" disabled>
            Current Plan
          </Button>
        ) : isFree ? (
          <Button className="w-full" variant="outline" disabled>
            Free Plan
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={popular ? "default" : "outline"}
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Subscribe Now"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
