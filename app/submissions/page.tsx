'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

interface Assignment {
  _id: string;
  testId: {
    _id: string;
    title: string;
    description: string;
    type: 'reading' | 'listening' | 'writing' | 'mixed';
    duration: number;
  };
  dueDate: string;
  isActive: boolean;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  submission?: {
    _id: string;
    status: 'in-progress' | 'completed';
    score?: number;
    submittedAt?: string;
    timeSpent?: number;
  };
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Get user profile
      const userProfile = await authService.getProfile();
      setUser(userProfile);

      // Fetch assignments for the student
      await fetchAssignments();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      router.push('/login');
    }
  };

  const fetchAssignments = async () => {
    try {
      // Try the my-assignments endpoint first, fallback to regular assignments
      let data;
      try {
        data = await authService.apiRequest('/assignments/my-assignments');
      } catch (error) {
        console.warn('my-assignments endpoint not available, using fallback');
        // Fallback to regular assignments endpoint
        data = await authService.apiRequest('/assignments?page=1&limit=100');
      }

      const assignments = data.assignments || [];
      const processedAssignments = assignments.map((assignment: any) => {
        const now = new Date();
        const dueDate = new Date(assignment.dueDate);
        let status = 'pending';

        if (assignment.submission) {
          if (assignment.submission.status === 'completed') {
            status = 'completed';
          } else {
            status = 'in-progress';
          }
        } else if (now > dueDate) {
          status = 'overdue';
        }

        return {
          ...assignment,
          status
        };
      });

      setAssignments(processedAssignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      // Set empty array but don't show error to user
      setAssignments([]);
      // You could show a toast notification here if needed
      // toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (assignmentId: string, testId: string) => {
    try {
      // Check if there's already a submission in progress
      try {
        const existingSubmissions = await authService.apiRequest(`/submissions?testId=${testId}&status=in-progress`);
        if (existingSubmissions && existingSubmissions.length > 0) {
          // Continue existing submission
          const existingSubmission = existingSubmissions[0];
          router.push(`/submissions/take-test/${testId}?submission=${existingSubmission._id}`);
          return;
        }
      } catch (error) {
        console.log('No existing submission found, starting new one');
      }

      // Start new test submission
      try {
        const response = await authService.startSubmission(testId, assignmentId);
        router.push(`/submissions/take-test/${testId}?submission=${response.submissionId}`);
      } catch (error) {
        console.error('Failed to start submission:', error);
        // Fallback: navigate without submission ID
        router.push(`/submissions/take-test/${testId}?assignment=${assignmentId}`);
      }

    } catch (error) {
      console.error('Failed to start test:', error);
      // Final fallback: navigate with assignment ID
      router.push(`/submissions/take-test/${testId}?assignment=${assignmentId}`);
    }
  };

  const handleContinueTest = (submissionId: string, testId: string) => {
    router.push(`/submissions/take-test/${testId}?submission=${submissionId}`);
  };

  const handleViewResults = (submissionId: string) => {
    router.push(`/submissions/results/${submissionId}`);
  };

  const handleLogout = () => {
    authService.logout();
    router.push('/login');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Play className="h-4 w-4 text-blue-600" />;
      case 'overdue': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
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

  const filteredAssignments = assignments.filter(assignment =>
    assignment.testId?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.testId?.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading your tests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h1 className="text-xl font-semibold">IELTS Test Center</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user && (
                <div className="text-sm text-muted-foreground">
                  Welcome, {user.firstName} {user.lastName}
                </div>
              )}
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Tests</h2>
            <p className="text-muted-foreground">View and take your assigned IELTS tests</p>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Search Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tests..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Tests ({filteredAssignments.length})</CardTitle>
              <CardDescription>
                Your IELTS test assignments and progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[70vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((assignment) => {
                      const isOverdue = new Date() > new Date(assignment.dueDate);
                      const actualStatus = isOverdue && assignment.status === 'pending' ? 'overdue' : assignment.status;

                      return (
                        <TableRow key={assignment._id}>
                          <TableCell className="max-w-xs">
                            <div className="font-medium">{assignment.testId?.title}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {assignment.testId?.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTypeIcon(assignment.testId?.type)}
                              <span className="capitalize">{assignment.testId?.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {assignment.testId?.duration}m
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(assignment.dueDate), 'PPP')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(assignment.dueDate), 'p')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(actualStatus)} variant="outline">
                              {getStatusIcon(actualStatus)}
                              <span className="ml-1">{actualStatus}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {assignment.submission?.score ? (
                              <div className="text-sm font-medium">
                                {assignment.submission.score}%
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {assignment.status === 'pending' && !isOverdue && (
                                <Button
                                  size="sm"
                                  disabled={loading}
                                  onClick={() => handleStartTest(assignment._id, assignment.testId?._id)}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  {loading ? 'Starting...' : 'Start'}
                                </Button>
                              )}

                              {assignment.status === 'in-progress' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={loading}
                                  onClick={() => handleContinueTest(assignment.submission!._id, assignment.testId?._id)}
                                >
                                  <Play className="h-4 w-4 mr-1" />
                                  {loading ? 'Loading...' : 'Continue'}
                                </Button>
                              )}

                              {assignment.status === 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleViewResults(assignment.submission!._id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  View Results
                                </Button>
                              )}

                              {actualStatus === 'overdue' && (
                                <Badge variant="destructive" className="text-xs">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}