'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  History,
  User
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface SubmissionAnswer {
  questionId: string;
  subQuestionId?: string;
  subQuestionNumber?: number;
  answer: string;
  score: number;
  _id: string;
}

interface Submission {
  _id: string;
  testId: {
    _id: string;
    title: string;
    type: string;
    duration: number;
  };
  userId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  assignmentId: string;
  answers: SubmissionAnswer[];
  totalScore: number;
  autoScore: number;
  manualScore: number;
  isFullyGraded: boolean;
  startedAt: string;
  timeRemaining: number;
  isTimeout: boolean;
  lastSavedAt: string;
  status: 'in-progress' | 'submitted' | 'graded' | 'expired';
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}

interface SubmissionsResponse {
  submissions: Submission[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

export default function MyTestResultsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchSubmissions();
  }, [currentPage, statusFilter, typeFilter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: currentPage,
        limit: 10
      };
      
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const data: SubmissionsResponse = await authService.getSubmissions(params);
      setSubmissions(data.submissions || []);
      setPagination(data.pagination || { current: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(submission => {
    const searchLower = searchTerm.toLowerCase();
    return (
      submission.testId.title.toLowerCase().includes(searchLower) ||
      submission.testId.type.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string, isTimeout: boolean) => {
    if (isTimeout) {
      return (
        <Badge variant="destructive" className="bg-orange-100 text-orange-800">
          <Clock className="h-3 w-3 mr-1" />
          Timeout
        </Badge>
      );
    }

    switch (status) {
      case 'submitted':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case 'graded':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <Award className="h-3 w-3 mr-1" />
            Graded
          </Badge>
        );
      case 'in-progress':
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'listening': return <FileText className="h-4 w-4" />;
      case 'writing': return <FileText className="h-4 w-4" />;
      case 'speaking': return <FileText className="h-4 w-4" />;
      case 'full': return <Target className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = total > 0 ? (score / total) * 100 : 0;
    if (percentage >= 90) return 'text-green-600 font-semibold';
    if (percentage >= 80) return 'text-blue-600 font-semibold';
    if (percentage >= 70) return 'text-yellow-600 font-semibold';
    if (percentage >= 60) return 'text-orange-600 font-semibold';
    return 'text-red-600 font-semibold';
  };

  const calculateStats = () => {
    const total = submissions.length;
    const submitted = submissions.filter(s => s.status === 'submitted').length;
    const graded = submissions.filter(s => s.status === 'graded').length;
    const avgScore = submissions.length > 0 
      ? submissions.reduce((sum, s) => sum + s.totalScore, 0) / submissions.length 
      : 0;

    return { total, submitted, graded, avgScore };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading your test results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8" />
            My Test Results
          </h1>
          <p className="text-muted-foreground">Review your completed tests and scores</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Tests taken</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.submitted}</div>
            <p className="text-xs text-muted-foreground">Successfully submitted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.graded}</div>
            <p className="text-xs text-muted-foreground">Fully graded tests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Points average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by test title or type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Test Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="listening">Listening</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="speaking">Speaking</SelectItem>
                <SelectItem value="full">Full Test</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Test Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Test Results ({pagination.total})</CardTitle>
          <CardDescription>
            Your completed test submissions and scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No test results found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters to see more results.' 
                  : "You haven't completed any tests yet."}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission._id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getTestTypeIcon(submission.testId.type)}
                          <div>
                            <div className="font-medium">{submission.testId.title}</div>
                            <div className="text-sm text-muted-foreground capitalize">
                              {submission.testId.type} • {submission.testId.duration} min
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(submission.status, submission.isTimeout)}
                      </TableCell>
                      <TableCell>
                        <div className="text-right">
                          <div className={`text-lg ${getScoreColor(submission.totalScore, submission.autoScore + submission.manualScore || 100)}`}>
                            {submission.totalScore}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            points
                          </div>
                          <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-1">
                            <span className="text-blue-600">Auto: {submission.autoScore}</span>
                            <span>•</span>
                            <span className="text-purple-600">Manual: {submission.manualScore}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {submission.submittedAt ? (
                            <>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(submission.submittedAt).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <div className="text-muted-foreground">Not submitted</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {submission.submittedAt && submission.startedAt ? (
                            <>
                              <div className="font-medium">
                                {Math.round(
                                  (new Date(submission.submittedAt).getTime() - 
                                   new Date(submission.startedAt).getTime()) / 60000
                                )} min
                              </div>
                              <div className="text-xs text-muted-foreground">
                                of {submission.testId.duration} min
                              </div>
                            </>
                          ) : (
                            <div className="text-muted-foreground">-</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/submissions/review-result/${submission._id}`)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8"
                >
                  {page}
                </Button>
              );
            })}
            {pagination.pages > 5 && (
              <>
                <span className="px-2">...</span>
                <Button
                  variant={currentPage === pagination.pages ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pagination.pages)}
                  className="w-8"
                >
                  {pagination.pages}
                </Button>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage >= pagination.pages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
