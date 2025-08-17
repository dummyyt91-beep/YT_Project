"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast({
        title: "Success!",
        description: "Welcome back! Redirecting to dashboard...",
        variant: "default",
      });

      // Update authentication state in parent page
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'AUTH_SUCCESS' }, '*');
      }

      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (err: any) {
      // Convert technical errors to user-friendly messages
      let userMessage = "Something went wrong. Please try again.";

      if (
        err.message.includes("ECONNREFUSED") ||
        err.message.includes("Unable to connect to database")
      ) {
        userMessage =
          "We're experiencing technical difficulties. Please try again in a few minutes.";
      } else if (err.message.includes("Invalid credentials")) {
        userMessage =
          "Invalid email or password. Please check your credentials and try again.";
      } else if (err.message.includes("Login failed")) {
        userMessage =
          "Login failed. Please check your credentials and try again.";
      }

      toast({
        title: "Login Failed",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdminLoading(true);

    try {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminUsername, password: adminPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Admin login failed");
      }

      // No need to set localStorage.setItem("adminUser") here, as the API now handles token and cookie.
      // The admin dashboard will rely on the JWT token for authentication.

      toast({
        title: "Admin Access Granted",
        description: "Welcome, Admin! Redirecting to admin panel...",
        variant: "default",
      });

      setTimeout(() => router.push("/admin"), 1500);
    } catch (err: any) {
      let userMessage = "Something went wrong. Please try again.";

      if (err.message.includes("Invalid admin credentials")) {
        userMessage = "Invalid admin credentials. Please try again.";
      } else if (err.message.includes("Admin login failed")) {
        userMessage = "Admin login failed. Please try again.";
      }

      toast({
        title: "Access Denied",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsAdminLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <Play className="w-8 h-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">
              YouTube Transcript Analyzer
            </span>
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to your account or admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="user">User Login</TabsTrigger>
                <TabsTrigger value="admin">
                  <Shield className="w-4 h-4 mr-1" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="user">
                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Removed Alert component as per edit hint */}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute inset-y-0 right-0 px-3 text-sm text-blue-600"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link
                      href="/register"
                      className="text-blue-600 hover:underline"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  {/* Removed Alert component as per edit hint */}

                  <div className="space-y-2">
                    <Label htmlFor="adminUsername">Admin Username</Label>
                    <Input
                      id="adminUsername"
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Enter admin username"
                      required
                      disabled={isAdminLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminPassword">Admin Password</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                      disabled={isAdminLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isAdminLoading}
                  >
                    {isAdminLoading ? "Logging In..." : "Admin Login"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
