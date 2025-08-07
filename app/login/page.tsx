'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Shield } from 'lucide-react'
import Link from "next/link"
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [error, setError] = useState('')
  const [adminError, setAdminError] = useState('')
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]')
    
    // Find user
    const user = users.find((u: any) => u.username === username && u.password === password)
    
    if (user) {
      // Ensure user has a plan set
      if (!user.plan) {
        user.plan = 'free'
        // Update the user in the users array
        const userIndex = users.findIndex((u: any) => u.username === username)
        if (userIndex !== -1) {
          users[userIndex] = user
          localStorage.setItem('users', JSON.stringify(users))
        }
      }
      
      // Set current user
      localStorage.setItem('currentUser', JSON.stringify(user))
      router.push('/dashboard')
    } else {
      setError('Invalid username or password')
    }
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminError('')

    // Check admin credentials
    if (adminUsername === 'Shrushti.vachhani' && adminPassword === 'Shrushti@000') {
      // Set admin session
      localStorage.setItem('adminUser', JSON.stringify({ 
        username: 'Shrushti.vachhani', 
        role: 'admin',
        loginTime: new Date().toISOString()
      }))
      router.push('/admin')
    } else {
      setAdminError('Invalid admin credentials')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <Play className="w-8 h-8 text-blue-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">YouTube Transcript Analyzer</span>
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
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Sign In
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-blue-600 hover:underline">
                      Sign up
                    </Link>
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  {adminError && (
                    <Alert variant="destructive">
                      <AlertDescription>{adminError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminUsername">Admin Username</Label>
                    <Input
                      id="adminUsername"
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Enter admin username"
                      required
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
                    />
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Login
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
