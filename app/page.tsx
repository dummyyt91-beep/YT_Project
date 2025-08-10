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
import {
  Check,
  Play,
  BarChart3,
  MessageSquare,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import PricingCard from "@/components/pricing-card";

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showCancelAlert, setShowCancelAlert] = useState(false);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch("/api/me");
      if (res.ok) {
        const data = await res.json();
        setIsLoggedIn(!!data.user);
        setUser(data.user);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      // Call the logout API to clear server-side session
      await fetch("/api/auth/logout", { method: "POST" });
      
      // Clear client-side cookie
      document.cookie = "auth=; Max-Age=0; path=/";
      
      // Clear local state
      setIsLoggedIn(false);
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear local state even if logout fails
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  useEffect(() => {
    // Check session via API
    checkAuthStatus();

    // Check for canceled payment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("canceled") === "true") {
      setShowCancelAlert(true);
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Listen for authentication state changes
    const handleAuthChange = () => {
      checkAuthStatus();
    };

    // Listen for messages from login/register pages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'AUTH_SUCCESS') {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('focus', checkAuthStatus);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('focus', checkAuthStatus);
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  useEffect(() => {
    // Check for pricing section redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("section") === "pricing") {
      scrollToPricing();
    }
  }, []);

  const scrollToPricing = () => {
    const pricingSection = document.getElementById("pricing-section");
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const features = [
    {
      icon: <Play className="w-6 h-6" />,
      title: "YouTube Integration",
      description: "Extract transcripts from any YouTube video with just a URL",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "AI Analysis",
      description: "Get insights, summaries, and key points using advanced AI",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Interactive Chat",
      description: "Ask questions about the transcript and get instant answers",
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Time-stamped",
      description: "Navigate through content with precise timestamps",
    },
  ];

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
        "Standard support",
      ],
      popular: false,
      plan: "free",
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
        "Priority support",
      ],
      popular: true,
      plan: "pro",
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
        "24/7 support",
      ],
      popular: false,
      plan: "enterprise",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center pointer-events-none">
              <Play className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">
                YouTube Transcript Analyzer
              </h1>
            </div>
            <div className="flex space-x-4 pointer-events-auto">
              {isLoggedIn ? (
                <>
                  <div className="w-full">
                    <Link href="/dashboard" className="block w-full">
                      <Button className="w-full" variant="default">Dashboard</Button>
                    </Link>
                  </div>
                  <div className="w-full">
                    <Button variant="outline" onClick={handleLogout} className="w-full">
                      Logout
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-full">
                    <Link href="/login" className="block w-full">
                      <Button variant="outline" className="w-full">Login</Button>
                    </Link>
                  </div>
                  <div className="w-full">
                    <Link href="/register" className="block w-full">
                      <Button variant="default" className="w-full">Get Started</Button>
                    </Link>
                  </div>
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
              Payment was canceled. You can try again anytime or continue with
              the free plan.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400 rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500 rounded-full filter blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2 text-center lg:text-left">
              <Badge className="mb-4 px-4 py-2 text-sm bg-blue-100 text-blue-800 hover:bg-blue-100">
                AI-Powered Analysis
              </Badge>
              <h2 className="text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                Unlock the Power of
                <span className="text-blue-600 block mt-2">YouTube Transcripts</span>
              </h2>
              <p className="text-xl text-gray-600 mb-8 max-w-xl">
                Extract, analyze, and chat with YouTube video transcripts using
                advanced AI. Get insights, summaries, and answers from any video
                content in seconds.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/register">
                  <Button size="lg" className="px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto">
                    Start Free Trial
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg rounded-xl border-2 hover:bg-blue-50 transition-all duration-300 w-full sm:w-auto">
                  Watch Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-blue-${i*100} flex items-center justify-center text-white text-xs font-bold`}>U{i}</div>
                  ))}
                </div>
                <p className="ml-4 text-sm text-gray-600">Joined by <span className="font-bold">1,000+</span> content creators</p>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="relative z-10 bg-white p-2 rounded-2xl shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
                <div className="aspect-video rounded-xl overflow-hidden relative">
                  {/* Unsplash image related to video analysis/AI */}
                  <img 
                    src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80" 
                    alt="AI analyzing video content" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                    <h3 className="text-white font-bold">See how it works in 2 minutes</h3>
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-300 rounded-lg rotate-12 z-0 opacity-70"></div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-300 rounded-full z-0 opacity-70"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 text-sm bg-blue-100 text-blue-800 hover:bg-blue-100">
              Powerful Features
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Everything you need to analyze video content
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform helps you extract maximum value from YouTube
              videos with these powerful features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardHeader className="relative z-10">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-4 transform group-hover:scale-110 group-hover:bg-blue-200 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-2xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Feature Highlight */}
          <div className="mt-24 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl p-8 lg:p-12 shadow-xl">
            <div className="flex flex-col lg:flex-row items-center gap-12">
              <div className="lg:w-1/2">
                <h3 className="text-3xl font-bold text-gray-900 mb-6">Advanced AI Analysis</h3>
                <p className="text-lg text-gray-700 mb-6">Our platform uses state-of-the-art AI to analyze video transcripts and provide you with valuable insights that would take hours to extract manually.</p>
                
                <div className="space-y-4">
                  {[
                    "Automatic summarization of key points",
                    "Sentiment analysis across the video",
                    "Topic extraction and categorization",
                    "Question answering based on video content"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mt-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <p className="ml-3 text-gray-700">{item}</p>
                    </div>
                  ))}
                </div>
                
                <Button className="mt-8 px-6 py-3 rounded-xl">Learn More</Button>
              </div>
              
              <div className="lg:w-1/2">
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1591696205602-2f950c417cb9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                    alt="AI analysis dashboard" 
                    className="rounded-2xl shadow-xl w-full h-auto object-cover mb-6"
                  />
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <div className="flex items-center mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-gray-800 font-mono">AI: Here's a summary of the key points from the video:</p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-gray-800 font-mono">1. Introduction to machine learning concepts</p>
                        <p className="text-gray-800 font-mono">2. Practical applications in business</p>
                        <p className="text-gray-800 font-mono">3. Future trends to watch in 2025</p>
                      </div>
                      <div className="bg-gray-100 p-4 rounded-lg">
                        <p className="text-gray-800 font-mono">User: Can you elaborate on the business applications?</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 text-sm bg-blue-100 text-blue-800 hover:bg-blue-100">
              Why Choose Us
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              What makes our platform different
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've built our platform with content creators in mind, focusing on what matters most to you
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                alt="Team collaboration" 
                className="rounded-2xl shadow-xl w-full h-auto object-cover"
              />
            </div>
            
            <div className="space-y-8">
              {[
                {
                  title: "State-of-the-art AI Technology",
                  description: "Our platform leverages the latest advancements in artificial intelligence to provide accurate transcript analysis and insights.",
                  icon: <BarChart3 className="w-10 h-10 text-blue-600" />
                },
                {
                  title: "Built for Content Creators",
                  description: "Designed specifically for YouTubers and content creators who need to extract maximum value from their video content.",
                  icon: <Play className="w-10 h-10 text-blue-600" />
                },
                {
                  title: "Continuous Improvement",
                  description: "We're constantly updating our algorithms and adding new features based on user feedback and technological advancements.",
                  icon: <Clock className="w-10 h-10 text-blue-600" />
                },
                {
                  title: "Dedicated Support",
                  description: "Our team is always available to help you get the most out of our platform with responsive customer support.",
                  icon: <MessageSquare className="w-10 h-10 text-blue-600" />
                }
              ].map((item, index) => (
                <div key={index} className="flex gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 text-sm bg-blue-100 text-blue-800 hover:bg-blue-100">
              Our Team
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Meet the experts behind our platform
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our diverse team of AI specialists, developers, and content creators is dedicated to building the best transcript analysis tool
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Alex Morgan",
                role: "Founder & CEO",
                image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80",
                bio: "Former YouTube content creator with a passion for AI and making content creation more efficient."
              },
              {
                name: "Sophia Chen",
                role: "Chief AI Officer",
                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=688&q=80",
                bio: "PhD in Machine Learning with expertise in natural language processing and speech recognition."
              },
              {
                name: "Marcus Johnson",
                role: "Lead Developer",
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",
                bio: "Full-stack developer with 10+ years of experience building scalable web applications and AI systems."
              },
              {
                name: "Priya Patel",
                role: "Customer Success",
                image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=761&q=80",
                bio: "Dedicated to ensuring our users get the most value from our platform through training and support."
              }
            ].map((member, index) => (
              <Card key={index} className="border-0 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300">
                <div className="h-64 overflow-hidden">
                  <img src={member.image} alt={member.name} className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-110" />
                </div>
                <CardContent className="p-6 text-center">
                  <h4 className="font-bold text-xl text-gray-900 mb-1">{member.name}</h4>
                  <p className="text-blue-600 font-medium mb-4">{member.role}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                  <div className="mt-4 flex justify-center space-x-3">
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                      </svg>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                    </a>
                    <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 text-sm bg-blue-100 text-blue-800 hover:bg-blue-100">
              Testimonials
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by content creators worldwide
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our users are saying about how our platform has transformed their content strategy
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Content Creator",
                image: "/placeholder-user.jpg",
                quote: "This tool has completely transformed how I research and create content. The AI analysis saves me hours of work on every video!"
              },
              {
                name: "Michael Chen",
                role: "YouTube Educator",
                image: "/placeholder-user.jpg",
                quote: "As an educational content creator, being able to quickly analyze and reference my own videos has been invaluable. The transcript analysis is incredibly accurate."
              },
              {
                name: "Priya Sharma",
                role: "Marketing Director",
                image: "/placeholder-user.jpg",
                quote: "We use this tool to analyze competitor videos and extract insights. It's become an essential part of our content marketing strategy."
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-xl overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">{testimonial.quote}</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4">
                      <img src={testimonial.image} alt={testimonial.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
                      <p className="text-gray-600 text-sm">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section id="pricing-section" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-2 text-sm bg-blue-100 text-blue-800 hover:bg-blue-100">
              Pricing
            </Badge>
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Choose your plan
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and upgrade as you grow. All prices in Indian Rupees
              (₹)
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
      <section className="py-24 bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -left-40 -top-40 w-80 h-80 bg-blue-500 rounded-full"></div>
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500 rounded-full"></div>
          <div className="absolute left-1/3 top-1/4 w-64 h-64 bg-purple-500 rounded-full"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Badge className="mb-6 px-4 py-2 text-sm bg-blue-800 text-blue-100 hover:bg-blue-700 inline-block">
            Get Started Today
          </Badge>
          <h3 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-indigo-100">
            Ready to transform your content strategy?
          </h3>
          <p className="text-xl mb-10 max-w-3xl mx-auto text-blue-100">
            Join thousands of content creators who are already using our
            platform to analyze and extract insights from their videos.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-medium shadow-lg transform transition hover:scale-105">
                Start Your Free Trial
              </Button>
            </Link>
            <Button
              onClick={() => scrollToPricing()}
              variant="outline"
              className="bg-transparent border-2 border-blue-300 text-blue-100 hover:bg-white/10 px-8 py-4 rounded-xl text-lg font-medium transition-all duration-200"
            >
              View Pricing
            </Button>
          </div>
          <div className="mt-12 flex justify-center items-center space-x-8">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-100">No credit card required</span>
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-blue-100">Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-6">
                <svg className="h-8 w-8 text-blue-500 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                </svg>
                <h4 className="text-2xl font-bold">YT Analyzer</h4>
              </div>
              <p className="text-gray-400 max-w-md mb-6">
                Analyze YouTube videos with AI to extract insights and key
                points. Our platform helps content creators understand their videos better.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-6">Quick Links</h5>
              <ul className="space-y-4">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Register
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-6">Resources</h5>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">&copy; {new Date().getFullYear()} YT Analyzer. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
