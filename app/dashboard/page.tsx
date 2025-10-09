'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BookOpen,
  Users,
  FileText,
  ClipboardList,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Zap,
  Sparkles,
} from 'lucide-react';

const stats = [
  {
    title: 'Total Questions',
    value: '1,234',
    change: '+12%',
    trend: 'up',
    icon: BookOpen,
    color: 'text-blue-600',
  },
  {
    title: 'Active Students',
    value: '56',
    change: '+8%',
    trend: 'up',
    icon: Users,
    color: 'text-green-600',
  },
  {
    title: 'Tests Created',
    value: '89',
    change: '+23%',
    trend: 'up',
    icon: FileText,
    color: 'text-purple-600',
  },
  {
    title: 'Completed Tests',
    value: '345',
    change: '+18%',
    trend: 'up',
    icon: CheckCircle,
    color: 'text-emerald-600',
  },
  {
    title: 'Batch Created',
    value: '24',
    change: 'New!',
    trend: 'up',
    icon: Zap,
    color: 'text-blue-500',
  },
  {
    title: 'Templates Used',
    value: '8',
    change: 'New!',
    trend: 'up',
    icon: Sparkles,
    color: 'text-purple-500',
  },
];

const monthlyData = [
  { month: 'Jan', tests: 45, students: 12 },
  { month: 'Feb', tests: 52, students: 15 },
  { month: 'Mar', tests: 48, students: 18 },
  { month: 'Apr', tests: 61, students: 22 },
  { month: 'May', tests: 55, students: 25 },
  { month: 'Jun', tests: 67, students: 28 },
];

const testTypeData = [
  { name: 'Reading', value: 45, color: '#3B82F6' },
  { name: 'Listening', value: 30, color: '#10B981' },
  { name: 'Writing', value: 15, color: '#F59E0B' },
  { name: 'Speaking', value: 10, color: '#EF4444' },
];

const recentActivities = [
  {
    id: 1,
    action: 'New test created',
    details: 'IELTS Reading Practice Test 5',
    time: '2 hours ago',
    status: 'success',
  },
  {
    id: 2,
    action: 'Student submission',
    details: 'John Doe completed Listening Test 3',
    time: '4 hours ago',
    status: 'info',
  },
  {
    id: 3,
    action: 'Assignment created',
    details: 'Reading Test assigned to Class A',
    time: '6 hours ago',
    status: 'success',
  },
  {
    id: 4,
    action: 'Question updated',
    details: 'Modified question in Test 12',
    time: '1 day ago',
    status: 'warning',
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your IELTS tests.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                <span className="text-green-500">{stat.change}</span>
                <span className="ml-1">from last month</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

  

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Monthly Activity Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
            <CardDescription>Tests created and student activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="tests"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Test Type Distribution */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Test Distribution</CardTitle>
            <CardDescription>Breakdown by test type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={testTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {testTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {testTypeData.map((item) => (
                <div key={item.name} className="flex items-center space-x-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and changes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Students</CardTitle>
            <CardDescription>Highest scoring students this month</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Sarah Johnson', score: 95, tests: 8 },
              { name: 'Michael Chen', score: 92, tests: 6 },
              { name: 'Emily Rodriguez', score: 89, tests: 7 },
              { name: 'David Kim', score: 87, tests: 5 },
              { name: 'Lisa Zhang', score: 85, tests: 6 },
            ].map((student, index) => (
              <div key={student.name} className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{student.name}</p>
                    <Badge variant="secondary">{student.score}%</Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <span>{student.tests} tests completed</span>
                    <div className="h-1 w-20 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, student.score))}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}