"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  LogOut,
  User,
  Send,
  MessageSquare,
  Youtube,
  Loader2,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface TranscriptItem {
  text: string;
  start?: number;
  duration?: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [transcript, setTranscript] = useState<TranscriptItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [showCollections, setShowCollections] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);

  const formatTime = (seconds?: number) => {
    if (seconds === undefined) return "";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Fetch user data from API
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/me");
        const data = await res.json();

        if (!res.ok || !data.user) {
          router.push("/login");
          return;
        }

        let userData = data.user;

        if (!userData.plan) {
          userData.plan = "free";
        }

        // Check for successful payment
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("success") === "true") {
          const plan = urlParams.get("plan");
          if (plan) {
            // Clear URL params
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );

            // Refresh user data to get updated plan
            const refreshRes = await fetch("/api/me");
            const refreshData = await refreshRes.json();
            if (refreshRes.ok && refreshData.user) {
              userData = refreshData.user;
            }
          }
        }

        setUser(userData);
      } catch (error) {
        console.error("Error fetching user data:", error);
        router.push("/login");
      }
    };

    fetchUserData();

    // Load user's collections from API
    const fetchCollections = async () => {
      try {
        const collectionsRes = await fetch("/api/collections");
        const collectionsData = await collectionsRes.json();
        if (collectionsRes.ok && collectionsData.collections) {
          setCollections(collectionsData.collections);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
      }
    };

    fetchCollections();
  }, [router]);

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    return youtubeRegex.test(url);
  };

  const canUseService = () => {
    if (user.plan === "enterprise") return true;
    if (user.plan === "pro" && user.attemptsRemaining > 0) return true;
    if (user.plan === "free" && user.attemptsRemaining > 0) return true;
    return false;
  };

  const fetchTranscript = async () => {
    if (!isValidYouTubeUrl(youtubeUrl)) {
      setError("Please enter a valid YouTube URL");
      return;
    }

    if (!canUseService()) {
      setError(
        "You have used all your attempts. Upgrade to Pro for more access!"
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch transcript");
      }

      setTranscript(data.transcript);

      // Use the collection created by the transcript API
      if (data.collectionId) {
        // Create local collection entry with database ID from transcript API
        const collection = {
          id: data.collectionId,
          _id: data.collectionId,
          url: youtubeUrl,
          title: data.title || "YouTube Video",
          transcript: data.transcript,
          createdAt: new Date().toISOString(),
          chatHistory: [],
        };

        // Save to collections
        const updatedCollections = [...collections, collection];
        setCollections(updatedCollections);

        // Set as selected collection for chat
        setSelectedCollection(collection);
      } else {
        console.error("No collection ID returned from transcript API");
        setError("Failed to create collection. Please try again.");
      }

      // Attempts are managed by the API
      // Refresh user data to get updated attempts
      try {
        const refreshRes = await fetch("/api/me");
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.user) {
          setUser(refreshData.user);
        }
      } catch (error) {
        console.error("Error refreshing user data:", error);
      }

      // Store current transcript
      // No need to store transcript in localStorage
    } catch (err: any) {
      setError(err.message || "Failed to fetch transcript");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCollection = async (collection: any) => {
    setSelectedCollection(collection);
    setTranscript(collection.transcript);
    
    // Fetch messages for this collection from the database
    try {
      const messagesRes = await fetch(`/api/collections/${collection._id}/messages`);
      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        if (messagesData.messages && messagesData.messages.length > 0) {
          // Format messages for the UI
          const formattedMessages = messagesData.messages.map((msg: any) => ({
            id: msg._id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(formattedMessages);
        } else {
          // No messages yet, set default welcome message
          setMessages([
            {
              id: "1",
              role: "assistant",
              content: "Hello! I'm ready to help you analyze this transcript. You can ask me questions about the content, request summaries, key points, or any specific information from the video.",
              timestamp: new Date()
            }
          ]);
        }
      } else {
        // Error fetching messages, set default welcome message
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: "Hello! I'm ready to help you analyze this transcript. You can ask me questions about the content, request summaries, key points, or any specific information from the video.",
            timestamp: new Date()
          }
        ]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Error fetching messages, set default welcome message
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "Hello! I'm ready to help you analyze this transcript. You can ask me questions about the content, request summaries, key points, or any specific information from the video.",
          timestamp: new Date()
        }
      ]);
    }
    
    setShowCollections(false);
    setShowChat(true);
  };

  // This function is now only used for updating the local state
  // Actual message persistence is handled by the API
  const saveMessageToCollection = async (newMessages: Message[]) => {
    if (selectedCollection) {
      // Update collection in state
      const updatedCollections = collections.map((col) =>
        (col.id === selectedCollection.id || col._id === selectedCollection._id)
          ? { ...col, chatHistory: newMessages }
          : col
      );
      setCollections(updatedCollections);
    }
  };

  const redirectToPricing = () => {
    router.push("/?section=pricing");
  };

  const startChat = () => {
    if (!selectedCollection) {
      console.error("No collection selected for chat");
      return;
    }

    setShowChat(true);
    setMessages([
      {
        id: "1",
        role: "assistant",
        content:
          "Hello! I'm ready to help you analyze this transcript. You can ask me questions about the content, request summaries, key points, or any specific information from the video.",
        timestamp: new Date(),
      },
    ]);
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    // Create a temporary user message for immediate UI feedback
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const collectionId = selectedCollection?.id || selectedCollection?._id;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: chatInput,
          transcript: transcript,
          collectionId: collectionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "No attempts remaining. Upgrade your plan.") {
          toast({
            title: "No attempts remaining",
            description: "Please upgrade your plan to continue chatting.",
            variant: "destructive",
          });
          // Update user state to reflect zero attempts
          setUser(prev => ({ ...prev, attemptsRemaining: 0 }));
        }
        throw new Error(data.error || "Failed to get AI response");
      }

      // Update user attempts if provided in the response
      if (data.attemptsRemaining !== undefined) {
        setUser(prev => ({ ...prev, attemptsRemaining: data.attemptsRemaining }));
      }
      
      // After successful API call, refresh messages from the database
      if (collectionId) {
        try {
          const messagesRes = await fetch(`/api/collections/${collectionId}/messages`);
          if (messagesRes.ok) {
            const messagesData = await messagesRes.json();
            if (messagesData.messages && messagesData.messages.length > 0) {
              // Format messages for the UI
              const formattedMessages = messagesData.messages.map((msg: any) => ({
                id: msg._id,
                role: msg.role,
                content: msg.content,
                timestamp: new Date(msg.timestamp)
              }));
              setMessages(formattedMessages);
              
              // Update local collection state
              saveMessageToCollection(formattedMessages);
              setIsChatLoading(false);
              return; // Exit early as we've updated messages from the database
            }
          }
        } catch (error) {
          console.error("Error refreshing messages:", error);
          // Continue with fallback approach below if refresh fails
        }
      }
      
      // Fallback: If we couldn't refresh from database, update UI with local data
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      saveMessageToCollection(finalMessages);
      
    } catch (err: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear the auth cookie
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }

    // Redirect to home page
    router.push("/");
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case "pro":
        return "bg-blue-500";
      case "enterprise":
        return "bg-purple-500";
      case "free":
      default:
        return "bg-gray-500";
    }
  };

  const getAttemptsDisplay = () => {
    if (user.plan === "enterprise") return "Unlimited";
    if (user.plan === "pro") return `${user.attemptsRemaining}/100`;
    return `${user.attemptsRemaining}/5 daily`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center group transition-all duration-300 hover:scale-105">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3 shadow-md">
                <Play className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                YouTube Transcript Analyzer
              </h1>
            </Link>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowCollections(!showCollections)}
                className="hidden md:flex items-center hover:bg-blue-50 transition-colors duration-300"
              >
                <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                My Collections ({collections.length})
              </Button>
              <div className="flex items-center space-x-2 bg-gray-50 p-2 rounded-lg shadow-sm">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <User className="w-4 h-4 text-blue-700" />
                </div>
                <span className="text-gray-700 font-medium">{user.username}</span>
                <Badge
                  className={`${getPlanBadgeColor(
                    user.plan || "free"
                  )} text-white shadow-sm transition-all duration-300 hover:scale-105`}
                >
                  {user.plan === "enterprise" && (
                    <Crown className="w-3 h-3 mr-1" />
                  )}
                  {(user.plan || "free").toUpperCase()}
                </Badge>
                <Badge variant={canUseService() ? "default" : "destructive"} className="shadow-sm transition-all duration-300 hover:scale-105">
                  {getAttemptsDisplay()} attempts
                </Badge>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors duration-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showCollections ? (
          /* Collections View */
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  My Collections
                </h2>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowCollections(false)}
                className="hover:bg-blue-50 transition-colors duration-300"
              >
                Back to Dashboard
              </Button>
            </div>

            {collections.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Youtube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Collections Yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Start analyzing YouTube videos to build your collection
                  </p>
                  <Button onClick={() => setShowCollections(false)}>
                    Analyze Your First Video
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.map((collection) => (
                  <Card
                    key={collection.id}
                    className="cursor-pointer hover:shadow-lg hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden border-0 shadow-md"
                  >
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-1">
                      <CardHeader>
                        <div className="flex items-start space-x-2">
                          <div className="bg-white p-2 rounded-md shadow-sm">
                            <Youtube className="w-5 h-5 text-red-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg font-bold text-gray-800 truncate">
                              {collection.title}
                            </CardTitle>
                            <CardDescription>
                              {new Date(collection.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </div>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {collection.transcript
                          .slice(0, 3)
                          .map((item: any) => item.text)
                          .join(" ")}
                        ...
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => loadCollection(collection)}
                          className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300"
                        >
                          Open Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setTranscript(collection.transcript);
                            setShowCollections(false);
                            setShowChat(false);
                          }}
                          className="hover:bg-blue-50 transition-colors duration-300"
                        >
                          View Transcript
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : !showChat ? (
          <div className="space-y-8">
            {/* Plan Status Card */}
            {(user.plan === "pro" || user.plan === "enterprise") && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">
                      {user.plan === "pro"
                        ? "Pro Plan Active"
                        : "Enterprise Plan Active"}
                    </span>
                  </div>
                  <Badge className="bg-green-600 text-white">
                    {user.plan === "enterprise"
                      ? "Unlimited"
                      : `${user.attemptsRemaining} attempts left`}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {user.plan === "free" && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center space-x-2">
                    <Play className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">
                      Free Plan
                    </span>
                    <span className="text-sm text-blue-600">
                      - Upgrade to unlock more features
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={redirectToPricing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Upgrade to Pro ₹99/month
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* YouTube URL Input Section */}
            <Card className="border-blue-100 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center text-white">
                  <Youtube className="w-6 h-6 mr-2" />
                  Analyze YouTube Video
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Enter a YouTube URL to extract and analyze its transcript with
                  AI
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50 animate-pulse">
                    <AlertDescription className="flex items-center">
                      {error}
                      {!canUseService() && (
                        <Button
                          variant="link"
                          className="p-0 h-auto ml-2 text-red-600 underline font-medium"
                          onClick={redirectToPricing}
                        >
                          Upgrade Now
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Youtube className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="flex-1 pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={fetchTranscript}
                    disabled={isLoading || !canUseService()}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Analyze Video
                      </>
                    )}
                  </Button>
                </div>

                {!canUseService() && (
                  <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 shadow-sm">
                    <div className="flex items-start">
                      <Crown className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <AlertDescription>
                        You've used all your attempts.
                        <Button
                          variant="link"
                          className="p-0 h-auto ml-1 text-indigo-600 hover:text-indigo-800 underline font-medium transition-colors duration-300"
                          onClick={redirectToPricing}
                        >
                          Upgrade to Pro (₹99/month)
                        </Button>
                        for 100 daily attempts, or wait until tomorrow for 5 new
                        attempts.
                      </AlertDescription>
                    </div>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Usage Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {user.plan === "free" ? "Daily Usage" : "Plan Usage"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {user.plan === "enterprise" ? (
                        <span>Unlimited attempts available</span>
                      ) : user.plan === "pro" ? (
                        <span>
                          Attempts used:{" "}
                          <strong>{100 - user.attemptsRemaining}/100</strong>
                        </span>
                      ) : (
                        <span>
                          Attempts used today:{" "}
                          <strong>{5 - user.attemptsRemaining}/5</strong>
                        </span>
                      )}
                    </p>
                    {user.plan === "free" && (
                      <p className="text-xs text-gray-500 mt-1">
                        Resets daily at midnight
                      </p>
                    )}
                  </div>
                  {user.plan !== "enterprise" && (
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width:
                            user.plan === "pro"
                              ? `${
                                  ((100 - user.attemptsRemaining) / 100) * 100
                                }%`
                              : `${((5 - user.attemptsRemaining) / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transcript Display */}
            {transcript && (
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div>
                    <CardTitle className="flex items-center">
                      <Youtube className="w-5 h-5 mr-2 text-blue-600" />
                      Transcript
                    </CardTitle>
                    {/* Enhanced message */}
                    <div className="text-green-600 flex items-center text-sm mt-1">
                      Video transcript extracted successfully
                    </div>
                  </div>
                  <Button onClick={startChat} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat with Transcript
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] w-full border rounded-md p-4 bg-gray-50">
                    <div className="space-y-2">
                      {transcript.map((item, index) => (
                        <div key={index} className="flex items-start group">
                          <span className="font-mono text-xs text-gray-500 mr-3 mt-1">
                      {formatTime(item.start)}
                    </span>
                    <p className="text-sm leading-relaxed text-gray-800 flex-1 py-1">
                      {item.text}
                    </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Chat Interface - keep existing chat interface code */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Transcript Panel */}
            <Card className="lg:col-span-1 border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg flex items-center">
                  <Youtube className="w-5 h-5 mr-2 text-blue-600" />
                  Transcript Reference
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChat(false)}
                  className="hover:bg-blue-50 transition-colors duration-300"
                >
                  Back to Transcript
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2 text-xs">
                    {transcript?.slice(0, 20).map((item, index) => (
                      <div key={index} className="hover:bg-blue-50 p-1 rounded-md transition-colors duration-200">
                        {item.start && (
                          <span className="text-blue-600 font-mono mr-1 bg-blue-50 px-1 rounded">
                            [{Math.floor(item.start / 60)}:
                            {(item.start % 60).toFixed(0).padStart(2, "0")}]
                          </span>
                        )}
                        <span>{item.text}</span>
                      </div>
                    ))}
                    {transcript && transcript.length > 20 && (
                      <p className="text-gray-500 italic text-center mt-4 border-t pt-2">... and more</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Chat Panel */}
            <Card className="lg:col-span-2 border-0 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center text-white">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  AI Chat Assistant
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Ask questions about the transcript content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {/* Messages */}
                <ScrollArea className="h-96 border rounded-md p-4 bg-gray-50">
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {message.role !== "user" && (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                            <MessageSquare className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 shadow-sm ${
                            message.role === "user"
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                              : "bg-white border border-gray-100 text-gray-800"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center ml-2 flex-shrink-0">
                            <User className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                          <MessageSquare className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-lg px-4 py-3 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-sm text-gray-500">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Chat Input */}
                <div className="relative">
                  <Input
                    placeholder="Ask a question about the transcript..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && user.plan !== "enterprise" && user.attemptsRemaining > 0 && sendMessage()}
                    disabled={isChatLoading || (user.plan !== "enterprise" && user.attemptsRemaining <= 0)}
                    className="pr-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-300"
                  />
                  <Button
                    onClick={() => {
                      if (user.plan !== "enterprise" && user.attemptsRemaining <= 0) {
                        toast({
                          title: "No attempts remaining",
                          description: "Please upgrade your plan to continue chatting.",
                          variant: "destructive"
                        });
                        return;
                      }
                      sendMessage();
                    }}
                    disabled={isChatLoading || !chatInput.trim() || (user.plan !== "enterprise" && user.attemptsRemaining <= 0)}
                    className="absolute right-1 top-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 h-8 w-8 p-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>

                {/* Quick Questions */}
                <div className="flex flex-wrap gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <span className="text-xs font-medium text-blue-600 w-full mb-2">Quick Questions:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setChatInput("Summarize the main points of this video")
                    }
                    disabled={isChatLoading}
                    className="bg-white hover:bg-blue-50 transition-colors duration-300"
                  >
                    Summarize
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setChatInput("What are the key takeaways?")}
                    disabled={isChatLoading}
                    className="bg-white hover:bg-blue-50 transition-colors duration-300"
                  >
                    Key Points
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setChatInput("Analyze the sentiment of this content")
                    }
                    disabled={isChatLoading}
                    className="bg-white hover:bg-blue-50 transition-colors duration-300"
                  >
                    Sentiment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
