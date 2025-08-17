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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Shield,
  LogOut,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Crown,
  BarChart,
  LineChart,
  // Added for Scatter chart
  ScatterChart,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import 'chartjs-adapter-date-fns'; // Import the date adapter

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalUsers: 0,
    freeUsers: 0,
    proUsers: 0,
    enterpriseUsers: 0,
    monthlyRevenue: 0,
    totalTranscripts: 0,
  });
  const [chartData, setChartData] = useState<any>({
    planDistribution: { labels: [], datasets: [] },
    monthlyRevenue: { labels: [], datasets: [] },
    transcriptsOverTime: { labels: [], datasets: [] },
  });
  const router = useRouter();

  const [Bar, setBar] = useState<any>(null);
  const [Line, setLine] = useState<any>(null);
  const [Pie, setPie] = useState<any>(null);
  const [Scatter, setScatter] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      // Authentication is now handled by the 'auth' cookie set by the admin-login API.
      // No need for localStorage.getItem("adminUser") check here.
      // The API routes will handle token verification.

      // Fetch users and payments via admin endpoints (to be added later) or fallback to none
      try {
        const [usersRes, paymentsRes, transcriptsRes, statsRes] =
          await Promise.all([
            fetch("/api/admin/users", { credentials: "include" }),
            fetch("/api/admin/payments", { credentials: "include" }),
            fetch("/api/admin/transcripts", { credentials: "include" }),
            fetch("/api/admin/stats", { credentials: "include" }),
          ]);
        const usersData = usersRes.ok ? (await usersRes.json()).users : [];
        const paymentsData = paymentsRes.ok
          ? (await paymentsRes.json()).payments
          : [];
        const totalTranscripts = transcriptsRes.ok
          ? (await transcriptsRes.json()).totalTranscripts
          : 0;
        const statsData = statsRes.ok ? await statsRes.json() : {};

        // Process chart data
        const planLabels = Object.keys(statsData.planDistribution || {});
        const planCounts = Object.values(statsData.planDistribution || {});

        const monthlyRevenueLabels = (statsData.monthlyRevenue || []).map(
          (item: any) => `${item._id.month}/${item._id.year}`
        );
        const monthlyRevenueAmounts = (statsData.monthlyRevenue || []).map(
          (item: any) => item.totalAmount
        );

        const transcriptsDataForScatter = (statsData.transcriptsOverTime || []).map(
          (item: any) => ({
            x: new Date(item._id.year, item._id.month - 1, item._id.day),
            y: item.count,
          })
        );

        setChartData({
          planDistribution: {
            labels: planLabels,
            datasets: [
              {
                label: "Users by Plan",
                data: planCounts,
                backgroundColor: ["#8B5CF6", "#6366F1", "#3B82F6"], // Purple, Indigo, Blue
              },
            ],
          },
          monthlyRevenue: {
            labels: monthlyRevenueLabels,
            datasets: [
              {
                label: "Monthly Revenue",
                data: monthlyRevenueAmounts,
                borderColor: "#10B981",
                tension: 0.1,
              },
            ],
          },
          transcriptsOverTime: {
            datasets: [
              {
                label: "Transcripts Created",
                data: transcriptsDataForScatter,
                backgroundColor: "#EF4444", // Color for scatter points
                pointRadius: 5, // Size of the points
              },
            ],
          },
        });
        setUsers(usersData);
        setPayments(paymentsData);

        const totalRevenue = paymentsData.reduce(
          (sum: number, p: any) => sum + (p.amount || 0),
          0
        );
        const totalUsers = usersData.length;
        const freeUsers = usersData.filter(
          (u: any) => u.plan === "free" || !u.plan
        ).length;
        const proUsers = usersData.filter((u: any) => u.plan === "pro").length;
        const enterpriseUsers = usersData.filter(
          (u: any) => u.plan === "enterprise"
        ).length;
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = paymentsData
          .filter((p: any) => {
            const paymentDate = new Date(p.createdAt || p.date);
            return (
              paymentDate.getMonth() === currentMonth &&
              paymentDate.getFullYear() === currentYear
            );
          })
          .reduce(
            (sum: number, payment: any) => sum + (payment.amount || 0),
            0
          );

        setStats({
          totalRevenue,
          totalUsers,
          freeUsers,
          proUsers,
          enterpriseUsers,
          monthlyRevenue,
          totalTranscripts,
        });

        // Dynamically import Chart.js components
        const ChartJs = await import("chart.js/auto");
        const ReactChartJs = await import("react-chartjs-2");

        // Register necessary Chart.js components
        ChartJs.Chart.register(
          ChartJs.CategoryScale,
          ChartJs.LinearScale,
          ChartJs.BarElement,
          ChartJs.Title,
          ChartJs.Tooltip,
          ChartJs.Legend,
          ChartJs.ArcElement,
          ChartJs.PointElement,
          ChartJs.LineElement,
          // Added for Scatter chart
          ChartJs.TimeScale,
          ChartJs.PointElement
        );

        // Register the date adapter
        ChartJs.Chart.register(ChartJs.TimeScale);

        setBar(() => ReactChartJs.Bar);
        setLine(() => ReactChartJs.Line);
        setPie(() => ReactChartJs.Pie);
        setScatter(() => ReactChartJs.Scatter);
        setPie(ReactChartJs.Pie);
      } catch {
        // ignore
      }
    };
    init();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    router.push("/");
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case "pro":
        return <Badge className="bg-blue-500 text-white">Pro</Badge>;
      case "enterprise":
        return (
          <Badge className="bg-purple-500 text-white">
            <Crown className="w-3 h-3 mr-1" />
            Enterprise
          </Badge>
        );
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b-2 border-purple-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <Shield className="w-8 h-8 text-purple-600 mr-2" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    View Site
                  </Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="text-gray-700">admin@gmail.com</span>
                  <Badge className="bg-purple-600 text-white">Admin</Badge>
                </div>
                <Button variant="outline" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  All time earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Transcripts
                </CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalTranscripts.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Transcripts generated
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Monthly Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.monthlyRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Plan Distribution
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Free:</span>
                    <span>{stats.freeUsers}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Pro:</span>
                    <span className="text-blue-600 font-medium">
                      {stats.proUsers}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Enterprise:</span>
                    <span className="text-purple-600 font-medium">
                      {stats.enterpriseUsers}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList>
              <TabsTrigger value="users">Users Management</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                  <CardDescription>
                    Manage and view all registered users and their subscription
                    status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Attempts Remaining</TableHead>
                        <TableHead>Joined Date</TableHead>
                        <TableHead>Subscription Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.username}
                          </TableCell>
                          <TableCell>
                            {getPlanBadge(user.plan || "free")}
                          </TableCell>
                          <TableCell>
                            {user.plan === "enterprise"
                              ? "Unlimited"
                              : user.attemptsRemaining || 0}
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            {user.subscriptionDate
                              ? formatDate(user.subscriptionDate)
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                  <CardDescription>
                    View all successful payments and subscription details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stripe Session</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.username}
                          </TableCell>
                          <TableCell>{getPlanBadge(payment.plan)}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatCurrency(payment.amount)}
                          </TableCell>
                          <TableCell>{formatDate(payment.date)}</TableCell>
                          <TableCell>
                            <Badge className="bg-green-500 text-white">
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.stripeSessionId.substring(0, 20)}...
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {payments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No payments recorded yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Chart Cards */}
          {Bar && Line && Pie && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Users by Plan</CardTitle>
                  <CardDescription>
                    Distribution of users across different plans.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Bar
                    data={chartData.planDistribution}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "top" },
                        title: { display: true, text: "Users by Plan" },
                      },
                    }}
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                  <CardDescription>
                    Revenue generated over time.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Line
                    data={chartData.monthlyRevenue}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "top" },
                        title: { display: true, text: "Monthly Revenue" },
                      },
                    }}
                  />
                </CardContent>
              </Card>

              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Transcripts Created Over Time</CardTitle>
                  <CardDescription>
                    Number of transcripts generated daily.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                {Scatter && (
                  <Scatter
                    data={chartData.transcriptsOverTime}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: { position: "top" },
                        title: { display: true, text: "Transcripts Created Over Time" },
                      },
                      scales: {
                        x: {
                          type: 'time',
                          time: {
                            unit: 'day',
                            tooltipFormat: 'MMM d, yyyy',
                          },
                          title: {
                            display: true,
                            text: 'Date',
                          },
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Number of Transcripts',
                          },
                        },
                      },
                    }}
                  />
                )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
