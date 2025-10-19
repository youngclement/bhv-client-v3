'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Eye,
  Download,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Target,
  TrendingUp,
  Award,
  Users,
  Timer,
  BarChart3,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface SubmissionData {
  _id: string;
  testId: {
    _id: string;
    title: string;
    type: string;
    duration: number;
    totalPoints: number;
  };
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  assignmentId: {
    _id: string;
    dueDate: string;
    isActive: boolean;
  } | null;
  status: 'in-progress' | 'submitted' | 'pending-grading' | 'graded' | 'timeout';
  totalScore: number;
  autoScore: number;
  manualScore: number;
  percentage: number;
  isPassed: boolean;
  timeTakenMinutes: number;
  startedAt: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface SubmissionsResponse {
  message: string;
  submissions: SubmissionData[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
  stats: {
    total: number;
    byStatus: {
      inProgress: number;
      submitted: number;
      pendingGrading: number;
      graded: number;
      timeout: number;
    };
    averageScore: number;
  };
}

export default function TeacherSubmissionsPage() {
  const router = useRouter();
  const [data, setData] = useState<SubmissionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, statusFilter, startDate, endDate]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      params.append('page', currentPage.toString());
      params.append('limit', '15');

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (startDate) {
        params.append('startDate', startDate);
      }

      if (endDate) {
        params.append('endDate', endDate);
      }

      const token = authService.getToken();
      const response = await fetch(
        `${authService.getBaseUrl()}/submissions/admin/all?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch submissions');

      const responseData: SubmissionsResponse = await response.json();
      setData(responseData);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Client-side search filter
  const filteredSubmissions = data?.submissions.filter(submission => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      submission.testId.title.toLowerCase().includes(searchLower) ||
      `${submission.userId.firstName} ${submission.userId.lastName}`.toLowerCase().includes(searchLower) ||
      submission.userId.email.toLowerCase().includes(searchLower)
    );
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'submitted': {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Submitted'
      },
      'graded': {
        variant: 'default' as const,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Award,
        label: 'Graded'
      },
      'pending-grading': {
        variant: 'default' as const,
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Clock,
        label: 'Pending Grading'
      },
      'in-progress': {
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertCircle,
        label: 'In Progress'
      },
      'timeout': {
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: XCircle,
        label: 'Timeout'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      variant: 'outline' as const,
      className: '',
      icon: FileText,
      label: status
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getTestTypeIcon = (type: string) => {
    const icons = {
      reading: BookOpen,
      listening: FileText,
      writing: FileText,
      speaking: FileText,
      full: Target
    };
    const Icon = icons[type as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const handleViewDetails = async (submissionId: string) => {
    router.push(`/dashboard/submissions/results/${submissionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading submissions data...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              Failed to load submissions. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Submissions</h2>
          <p className="text-muted-foreground mt-1">
            Monitor and review all student test submissions
          </p>
        </div>
        <Button onClick={fetchSubmissions} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.stats.byStatus.submitted}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Completed tests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.stats.byStatus.graded}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Fully graded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.stats.byStatus.pendingGrading}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Needs grading</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.stats.averageScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Points average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Filters</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Student name, test title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="graded">Graded</SelectItem>
                  <SelectItem value="pending-grading">Pending Grading</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="timeout">Timeout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {(searchTerm || statusFilter !== 'all' || startDate || endDate) && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </Button>
              <span className="text-sm text-muted-foreground">
                Showing {filteredSubmissions.length} of {data.submissions.length} submissions
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
          <CardDescription>
            {data.pagination.total} total submissions across all students and tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] rounded-md border">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[200px]">Student</TableHead>
                  <TableHead className="w-[250px]">Test</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[120px] text-center">Score</TableHead>
                  <TableHead className="w-[100px] text-center">Grade</TableHead>
                  <TableHead className="w-[100px] text-center">Time</TableHead>
                  <TableHead className="w-[150px]">Submitted</TableHead>
                  <TableHead className="w-[120px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No submissions found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <TableRow key={submission._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs bg-primary/10">
                              {submission.userId.firstName.charAt(0)}
                              {submission.userId.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {submission.userId.firstName} {submission.userId.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {submission.userId.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTestTypeIcon(submission.testId.type)}
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {submission.testId.title}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {submission.testId.type} • {submission.testId.duration} min
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        {getStatusBadge(submission.status)}
                      </TableCell>

                      <TableCell>
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getScoreColor(submission.percentage)}`}>
                            {submission.totalScore}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            / {submission.testId.totalPoints}
                          </div>
                          <Progress
                            value={submission.percentage}
                            className="h-1 mt-1"
                          />
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={`font-bold ${getScoreColor(submission.percentage)}`}
                        >
                          {getGrade(submission.percentage)}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {submission.percentage}%
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Timer className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {submission.timeTakenMinutes}m
                          </span>
                        </div>
                        {submission.isPassed ? (
                          <div className="text-xs text-green-600 mt-1">✓ Passed</div>
                        ) : (
                          <div className="text-xs text-red-600 mt-1">✗ Failed</div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {submission.submittedAt ? (
                            <>
                              <div className="font-medium">
                                {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(submission.submittedAt).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Not submitted</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(submission._id)}
                            className="h-8"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data.pagination.pages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {data.pagination.current} of {data.pagination.pages} • Total: {data.pagination.total} submissions
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
                    let pageNum: number;
                    if (data.pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= data.pagination.pages - 2) {
                      pageNum = data.pagination.pages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-9 h-9"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(data.pagination.pages, prev + 1))}
                  disabled={currentPage >= data.pagination.pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}