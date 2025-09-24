'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Clock,
  Play,
  CheckCircle,
  AlertCircle,
  XCircle,
  BookOpen,
  Volume2,
  PenTool,
  Calendar,
  User,
  FileText,
  TrendingUp
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { format } from 'date-fns';

interface Submission {
  _id: string;
  testId: {
    _id: string;
    title: string;
    description: string;
    type: 'reading' | 'listening' | 'writing' | 'mixed';
    duration: number;
  };
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignmentId?: {
    _id: string;
    dueDate: string;
  };
  status: 'in-progress' | 'completed';
  score?: number;
  submittedAt?: string;
  timeSpent?: number;
  answers?: Record<string, string>;
  questionResults?: Array<{
    questionId: string;
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
    points: number;
    earnedPoints: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await authService.apiRequest('/submissions?page=1&limit=100&populate=testId,studentId,assignmentId');
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResults = (submissionId: string) => {
    router.push(`/dashboard/submissions/results/${submissionId}`);
  };

  const handleViewStudent = (studentId: string) => {
    router.push(`/dashboard/students/${studentId}`);
  };

  const getStatusIcon = (status: string, score?: number) => {
    switch (status) {
      case 'completed':
        return score && score >= 60 ?
          <CheckCircle className="h-4 w-4 text-green-600" /> :
          <XCircle className="h-4 w-4 text-red-600" />;
      case 'in-progress': return <Play className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string, score?: number) => {
    switch (status) {
      case 'completed':
        return score && score >= 60 ?
          'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'listening': return <Volume2 className="h-4 w-4" />;
      case 'writing': return <PenTool className="h-4 w-4" />;
      default: return <Play className="h-4 w-4" />;
    }
  };

  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.testId?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.studentId?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.studentId?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.studentId?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || submission.status === selectedStatus;
    const matchesType = selectedType === 'all' || submission.testId?.type === selectedType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate summary stats
  const totalSubmissions = submissions.length;
  const completedSubmissions = submissions.filter(s => s.status === 'completed').length;
  const inProgressSubmissions = submissions.filter(s => s.status === 'in-progress').length;
  const averageScore = completedSubmissions > 0 ?
    submissions.filter(s => s.status === 'completed' && s.score)
      .reduce((acc, s) => acc + (s.score || 0), 0) / completedSubmissions : 0;
  const passRate = completedSubmissions > 0 ?
    (submissions.filter(s => s.status === 'completed' && (s.score || 0) >= 60).length / completedSubmissions) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Test Submissions</h2>
        <p className="text-muted-foreground">Manage and review all test submissions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {completedSubmissions} completed, {inProgressSubmissions} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(averageScore)}`}>
              {averageScore.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all completed tests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${passRate >= 60 ? 'text-green-600' : 'text-red-600'}`}>
              {passRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tests with score ≥60%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSubmissions > 0 ? ((completedSubmissions / totalSubmissions) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Submissions completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by test name, student name, or email..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
            </select>
            <select
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="reading">Reading</option>
              <option value="listening">Listening</option>
              <option value="writing">Writing</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Submissions ({filteredSubmissions.length})</CardTitle>
          <CardDescription>
            All test submissions and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading submissions...</div>
          ) : (
            <ScrollArea className="max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Time Spent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions?.map((submission) => {
                    return (
                      <TableRow key={submission._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src="" alt={`${submission.studentId?.firstName} ${submission.studentId?.lastName}`} />
                              <AvatarFallback className="text-xs">
                                {getInitials(submission.studentId?.firstName || '', submission.studentId?.lastName || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {submission.studentId?.firstName} {submission.studentId?.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {submission.studentId?.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div className="font-medium">{submission.testId?.title}</div>
                          <div className="text-sm text-muted-foreground truncate">
                            {submission.testId?.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(submission.testId?.type || '')}
                            <span className="capitalize">{submission.testId?.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {submission.testId?.duration}m
                          </div>
                        </TableCell>
                        <TableCell>
                          {submission.submittedAt ? (
                            <div className="text-sm">
                              <div>{format(new Date(submission.submittedAt), 'PPP')}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(submission.submittedAt), 'p')}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Started {format(new Date(submission.createdAt), 'PPP')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(submission.status, submission.score)} variant="outline">
                            {getStatusIcon(submission.status, submission.score)}
                            <span className="ml-1">{submission.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {submission.score !== undefined ? (
                            <div className={`text-sm font-medium ${getScoreColor(submission.score)}`}>
                              {submission.score}%
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.timeSpent ? (
                            <div className="text-sm">
                              {formatTimeSpent(submission.timeSpent)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {submission.status === 'completed' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleViewResults(submission._id)}
                              >
                                <FileText className="h-4 w-4 mr-1" />
                                Results
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewStudent(submission.studentId?._id || '')}
                            >
                              <User className="h-4 w-4 mr-1" />
                              Student
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredSubmissions.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  No submissions found matching your criteria
                </div>
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}