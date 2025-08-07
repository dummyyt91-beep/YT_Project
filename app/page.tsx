'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Play, BarChart3, MessageSquare, Clock, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import PricingCard from "@/components/pricing-card"

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [showCancelAlert, setShowCancelAlert] = useState(false)

  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser')
    if (currentUser) {
      setIsLoggedIn(true)
      setUser(JSON.parse(currentUser))
    }

    // Check for canceled payment
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('canceled') === 'true') {
      setShowCancelAlert(true)
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  useEffect(() => {
    // Check for pricing section redirect
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('section') === 'pricing') {
      const pricingSection = document.getElementById('pricing-section')
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [])

  const features = [
    {
      icon: <Play className="w-6 h-6" />,
      title: "YouTube Integration",
      description: "Extract transcripts from any YouTube video with just a URL"
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "AI Analysis",
      description: "Get insights, summaries, and key points using advanced AI"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Interactive Chat",
      description: "Ask questions about the transcript and get instant answers"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Time-stamped",
      description: "Navigate through content with precise timestamps"
    }
  ]

  const pricingTiers = [
    {
      name: "Free",
      price: "₹0",
      period: "/month",
      attempts: "5 daily attempts",
      features: [
        "5 daily transcript extractions",
        "Basic AI analysis",
        "Chat interface",
        "Standard support"
      ],
      popular: false,
      plan: "free"
    },
    {
      name: "Pro",
      price: "₹99",
      period: "/month",
      attempts: "100 daily attempts",
      features: [
        "100 daily transcript extractions",
        "Advanced AI analysis",
        "Priority chat interface",
        "Export transcripts",
        "Priority support"
      ],
      popular: true,
      plan: "pro"
    },
    {
      name: "Enterprise",
      price: "₹999",
      period: "/month",
      attempts: "Unlimited attempts",
      features: [
        "Unlimited daily extractions",
        "Custom AI models",
        "API access",
        "Bulk processing",
        "24/7 support"
      ],
      popular: false,
      plan: "enterprise"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Play className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">YouTube Transcript Analyzer</h1>
            </div>
            <div className="flex space-x-4">
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button>Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline">Login</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Payment Canceled Alert */}
      {showCancelAlert && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Payment was canceled. You can try again anytime or continue with the free plan.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Unlock the Power of
            <span className="text-blue-600"> YouTube Transcripts</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Extract, analyze, and chat with YouTube video transcripts using advanced AI. 
            Get insights, summaries, and answers from any video content in seconds.
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/register">
              <Button size="lg" className="px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Everything you need to analyze video content
            </h3>
            <p className="text-lg text-gray-600">
              Powerful features to help you extract maximum value from YouTube videos
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing-section" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Choose your plan
            </h3>
            <p className="text-lg text-gray-600">
              Start free and upgrade as you grow. All prices in Indian Rupees (₹)
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <PricingCard
                key={index}
                name={tier.name}
                price={tier.price}
                period={tier.period}
                attempts={tier.attempts}
                features={tier.features}
                popular={tier.popular}
                plan={tier.plan}
                user={user}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to get started?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who are already analyzing YouTube content with AI
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="px-8 py-3">
              Start Your Free Trial
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Play className="w-6 h-6 text-blue-400 mr-2" />
              <span className="text-lg font-semibold">YouTube Transcript Analyzer</span>
            </div>
            <p className="text-gray-400">
              © 2025 YouTube Transcript Analyzer. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
