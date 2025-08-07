'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from "next/link"

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const plan = searchParams.get('plan')
    const userId = searchParams.get('user_id')

    if (sessionId && plan && userId) {
      // Update user plan
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const userIndex = users.findIndex((u: any) => u.id === parseInt(userId))
      
      if (userIndex !== -1) {
        const updatedUser = {
          ...users[userIndex],
          plan: plan,
          attemptsRemaining: plan === 'pro' ? 100 : plan === 'enterprise' ? 999 : users[userIndex].attemptsRemaining,
          subscriptionDate: new Date().toISOString(),
          stripeSessionId: sessionId
        }
        
        users[userIndex] = updatedUser
        localStorage.setItem('users', JSON.stringify(users))
        localStorage.setItem('currentUser', JSON.stringify(updatedUser))

        // Save payment record for admin
        const payments = JSON.parse(localStorage.getItem('payments') || '[]')
        const newPayment = {
          id: Date.now(),
          userId: parseInt(userId),
          username: updatedUser.username,
          plan: plan,
          amount: plan === 'pro' ? 99 : 999,
          currency: 'INR',
          stripeSessionId: sessionId,
          date: new Date().toISOString(),
          status: 'completed'
        }
        payments.push(newPayment)
        localStorage.setItem('payments', JSON.stringify(payments))

        setIsProcessing(false)
      } else {
        setError('User not found')
        setIsProcessing(false)
      }
    } else {
      setError('Invalid payment session')
      setIsProcessing(false)
    }
  }, [searchParams])

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
            <p className="text-gray-600">Please wait while we confirm your subscription.</p>
          </CardContent>
        </Card>
      </div>
    )
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
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your subscription has been activated successfully. You can now enjoy all the premium features.
          </p>
          <div className="space-y-2">
            <Link href="/dashboard">
              <Button className="w-full">Go to Dashboard</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
