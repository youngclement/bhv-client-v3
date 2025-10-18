'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
  Target,
  AlertCircle,
  Calendar,
  Activity,
  Loader2,
  ArrowRight,
  Volume2,
  PenTool,
  Play,
  XCircle
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface DashboardStats {
  users?: {
    total: number;
    byRole: {
      students: number;
      teachers: number;
      admins: number;
    };
    recentRegistrations: number;
  };
  tests: {
    total: number;
    active: number;
    inactive: number;
    byType: Record<string, number>;
    recentTests: any[];
  };
  questions: {
    total: number;
    withSubQuestions: number;
    byDifficulty: Array<{
      difficulty: string;
      count: number;
      totalPoints: number;
    }>;
  };
  assignments: {
    total: number;
    active: number;
    overdue: number;
    upcoming: number;
  };
  submissions: {
    total: number;
    byStatus: Record<string, number>;
    scoreStatistics: {
      avgScore: number;
      maxScore: number;
      minScore: number;
    };
    passRate: number;
  };
  recentActivities: Array<{
    type: string;
    title: string;
    user: {
      firstName: string;
      lastName: string;
    };
    timestamp: string;
    status?: string;
  }>;
  performanceOverview?: any;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const data = await authService.apiRequest('/dashboard/stats');
        console.log('Dashboard stats:', data);
        setStats(data.data);

        // Get user role from localStorage or token
        const user = authService.getCurrentUser();
        setUserRole(user?.role || '');
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'test_created': return <FileText className="h-4 w-4" />;
      case 'assignment_created': return <ClipboardList className="h-4 w-4" />;
      case 'submission': return <CheckCircle className="h-4 w-4" />;
      case 'question_created': return <BookOpen className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;
    const statusConfig: Record<string, { variant: any; className: string }> = {
      'submitted': { variant: 'default', className: 'bg-green-100 text-green-800 border-green-200' },
      'graded': { variant: 'default', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'in-progress': { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    };
    const config = statusConfig[status] || { variant: 'outline', className: '' };
    return <Badge variant={config.variant} className={`${config.className} text-xs`}>{status}</Badge>;
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <p className="text-muted-foreground">Failed to load dashboard</p>
        </div>
      </div>
    );
  }

  const isAdmin = userRole === 'admin';
  const isTeacher = userRole === 'teacher';
  const isStudent = userRole === 'student';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          {isStudent ? 'Track your progress and performance' : 'Welcome back! Here\'s what\'s happening'}
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tests Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/tests')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tests.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {stats.tests.active} active
              </Badge>
              {!isStudent && (
                <span className="text-xs text-muted-foreground">
                  {stats.tests.inactive} inactive
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Questions Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/questions')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.questions.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {stats.questions.withSubQuestions} composite
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Assignments Card */}
        {!isStudent && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/assignments')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assignments</CardTitle>
              <ClipboardList className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assignments.total}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {stats.assignments.active} active
                </Badge>
                {stats.assignments.overdue > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {stats.assignments.overdue} overdue
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submissions Card */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/submissions')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submissions</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submissions.total}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {stats.submissions.passRate}% pass rate
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Users Card (Admin only) */}
        {isAdmin && stats.users && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/students')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users.total}</div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {stats.users.byRole.students} students
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {stats.users.byRole.teachers} teachers
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        {/* Submissions Status Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Submissions Overview</CardTitle>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={Object.entries(stats.submissions.byStatus).map(([status, count]) => ({
                  name: status.replace(/([A-Z])/g, ' $1').trim(),
                  value: count,
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Score Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="p-3 bg-blue-50 rounded-lg text-center">
                <div className="text-lg font-bold text-blue-700">
                  {stats.submissions.scoreStatistics.avgScore.toFixed(1)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Score</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <div className="text-lg font-bold text-green-700">
                  {stats.submissions.passRate}%
                </div>
                <div className="text-xs text-muted-foreground">Pass Rate</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg text-center">
                <div className="text-lg font-bold text-purple-700">
                  {stats.submissions.total}
                </div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Type Distribution Pie Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Test Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.tests.byType).map(([type, count]) => ({
                    name: type.charAt(0).toUpperCase() + type.slice(1),
                    value: count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {Object.keys(stats.tests.byType).map((type, index) => {
                    const colors: Record<string, string> = {
                      reading: '#3b82f6',
                      listening: '#10b981',
                      writing: '#f59e0b',
                      full: '#8b5cf6',
                    };
                    return <Cell key={type} fill={colors[type] || '#6b7280'} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {Object.entries(stats.tests.byType).map(([type, count]) => {
                const colors: Record<string, string> = {
                  reading: '#3b82f6',
                  listening: '#10b981',
                  writing: '#f59e0b',
                  full: '#8b5cf6',
                };
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: colors[type] || '#6b7280' }}
                    />
                    <span className="text-xs capitalize">{type} ({count})</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Questions Difficulty Breakdown with Radar Chart */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questions by Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={stats.questions.byDifficulty.map((item) => ({
                difficulty: item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1),
                questions: item.count,
                points: item.totalPoints,
              }))}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="difficulty" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis tick={{ fontSize: 11 }} />
                <Radar
                  name="Questions"
                  dataKey="questions"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                />
                <Radar
                  name="Points"
                  dataKey="points"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.4}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  iconSize={12}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Question Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={stats.questions.byDifficulty.map((item) => ({
                  name: item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1),
                  questions: item.count,
                  points: item.totalPoints,
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  iconSize={12}
                />
                <Bar dataKey="questions" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Questions" />
                <Bar dataKey="points" fill="#10b981" radius={[8, 8, 0, 0]} name="Points" />
              </BarChart>
            </ResponsiveContainer>

            {/* Summary */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {stats.questions.byDifficulty.map((item) => {
                const colors: Record<string, string> = {
                  easy: 'bg-green-50 text-green-700',
                  medium: 'bg-yellow-50 text-yellow-700',
                  hard: 'bg-red-50 text-red-700',
                };
                return (
                  <div key={item.difficulty} className={`p-3 rounded-lg text-center ${colors[item.difficulty]}`}>
                    <div className="text-lg font-bold">{item.count}</div>
                    <div className="text-xs capitalize">{item.difficulty}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Activities</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4 pr-4">
                {stats.recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {activity.user.firstName} {activity.user.lastName}
                        </span>
                        {activity.status && getStatusBadge(activity.status)}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Tests */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Tests</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/tests')}
              >
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-3 pr-4">
                {stats.tests.recentTests.slice(0, 10).map((test: any) => {
                  const getTypeIcon = (type: string) => {
                    switch (type) {
                      case 'reading': return <BookOpen className="h-4 w-4 text-blue-600" />;
                      case 'listening': return <Volume2 className="h-4 w-4 text-green-600" />;
                      case 'writing': return <PenTool className="h-4 w-4 text-orange-600" />;
                      case 'full': return <Play className="h-4 w-4 text-purple-600" />;
                      default: return <FileText className="h-4 w-4" />;
                    }
                  };

                  return (
                    <div
                      key={test._id}
                      className="p-3 border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/tests/${test._id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {getTypeIcon(test.type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{test.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {test.type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {test.totalPoints} pts
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant={test.isActive ? 'default' : 'secondary'} className="text-xs">
                          {test.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => router.push('/dashboard/tests')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">View Tests</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => router.push('/dashboard/questions')}
            >
              <BookOpen className="h-6 w-6" />
              <span className="text-sm">Browse Questions</span>
            </Button>
            {!isStudent && (
              <>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => router.push('/dashboard/assignments')}
                >
                  <ClipboardList className="h-6 w-6" />
                  <span className="text-sm">Assignments</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2"
                  onClick={() => router.push('/dashboard/submissions')}
                >
                  <CheckCircle className="h-6 w-6" />
                  <span className="text-sm">View Submissions</span>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
