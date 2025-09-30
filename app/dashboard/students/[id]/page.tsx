'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Award,
  BookOpen,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { Label } from '@/components/ui/label';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  stats?: {
    testsCompleted: number;
    totalAssignments?: number;
    inProgressTests?: number;
    pendingTests?: number;
    averageScore: number;
    totalTimeSpent: number;
    strongestSkill: string;
    passRate?: number;
    averageScores?: Record<string, number>;
    testCounts?: Record<string, number>;
  };
}

interface Assignment {
  _id: string;
  testId: {
    title: string;
    type: string;
    duration: number;
  };
  dueDate: string;
  isActive: boolean;
  status: 'pending' | 'completed' | 'overdue';
}

interface Submission {
  _id: string;
  testId: {
    title: string;
    type: string;
    _id?: string;
    duration?: number;
  };
  score: number;
  submittedAt: string;
  timeSpent: number;
  startedAt?: string;
  status?: string;
  assignmentId?: string;
  totalPoints?: number;
  answers?: Record<string, string> | Array<{
    questionId: string;
    answer: string;
    timeSpent?: number;
    _id?: string;
  }>;
  questionResults?: Array<{
    isCorrect: boolean;
    userAnswer: string;
    correctAnswer: string;
  }>;
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchStudentData(params.id as string);
    }
  }, [params.id]);

  const fetchStudentData = async (id: string) => {
    try {
      // Fetch student profile with statistics
      const [studentData, statisticsData, assignmentsData, submissionsData] = await Promise.all([
        authService.getStudent(id),
        authService.getStudentStatistics(id),
        authService.apiRequest(`/assignments?studentId=${id}`),
        authService.apiRequest(`/submissions?studentId=${id}`)
      ]);

      setStudent({
        ...studentData,
        stats: statisticsData.statistics
      });
      setAssignments(assignmentsData.assignments || []);
      setSubmissions(submissionsData.submissions || []);
    } catch (error) {
      console.error('Failed to fetch student data:', error);
      setStudent(null);
      setAssignments([]);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'overdue': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeSpent = (minutes?: number) => {
    const totalMinutes = typeof minutes === 'number' && !isNaN(minutes) ? minutes : 0;
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Accept seconds (from submissions API) and render h m s
  const formatDurationHMS = (seconds?: number) => {
    const totalSeconds = typeof seconds === 'number' && !isNaN(seconds) ? seconds : 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading student...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Student not found</p>
        <Button onClick={() => router.push('/dashboard/students')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/students')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Student Profile</h2>
          <p className="text-muted-foreground">View student progress and performance</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1 max-h-screen overflow-y-auto">
          <Card>
            <CardHeader className="text-center">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src="" alt={`${student.firstName} ${student.lastName}`} />
                <AvatarFallback className="text-lg">
                  {getInitials(student.firstName, student.lastName)}
                </AvatarFallback>
              </Avatar>
              <CardTitle>{student.firstName} {student.lastName}</CardTitle>
              <CardDescription className="flex items-center justify-center gap-1">
                <Mail className="h-4 w-4" />
                {student.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Assignments</span>
                    <span className="font-medium">{student.stats?.totalAssignments || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Tests Completed</span>
                    <span className="font-medium">{student.stats?.testsCompleted || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>In Progress</span>
                    <span className="font-medium text-blue-600">{student.stats?.inProgressTests || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Pending</span>
                    <span className="font-medium text-yellow-600">{student.stats?.pendingTests || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span>Average Score</span>
                  <span className={`font-medium ${getScoreColor(student.stats?.averageScore || 0)}`}>
                    {student.stats?.averageScore || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Pass Rate</span>
                  <span className={`font-medium ${student.stats?.passRate && student.stats.passRate >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                    {student.stats?.passRate || 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Time Spent</span>
                  <span className="font-medium">{formatTimeSpent(student.stats?.totalTimeSpent || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Strongest Skill</span>
                  <Badge variant="secondary">{student.stats?.strongestSkill || 'N/A'}</Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {new Date(student.createdAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 max-h-screen overflow-y-auto">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="assignments">Assignments ({assignments.length})</TabsTrigger>
              <TabsTrigger value="submissions">Submissions ({submissions.length})</TabsTrigger>
              <TabsTrigger value="answers">Answer Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{student.stats?.totalAssignments || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {student.stats?.testsCompleted || 0} completed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pass Rate</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${student.stats?.passRate && student.stats.passRate >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                      {student.stats?.passRate || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tests passed (≥60%)
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${getScoreColor(student.stats?.averageScore || 0)}`}>
                      {student.stats?.averageScore || 0}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Overall performance
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
                      {student.stats?.totalAssignments ?
                        Math.round(((student.stats.testsCompleted || 0) / student.stats.totalAssignments) * 100) : 0}%
                    </div>
                    {(() => {
                      const total = student.stats?.totalAssignments || 0;
                      const completed = student.stats?.testsCompleted || 0;
                      const percent = total > 0 ? Math.min(100, Math.max(0, (completed / total) * 100)) : 0;
                      return (
                        <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>

              {/* Test Type Performance */}
              {student.stats?.averageScores && (
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Test Type</CardTitle>
                    <CardDescription>Average scores across different IELTS test types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      {Object.entries(student.stats.averageScores).map(([type, score]) => (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium capitalize">{type}</span>
                            <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                              {score}%
                            </span>
                          </div>
                          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {student.stats?.testCounts?.[type as keyof typeof student.stats.testCounts] || 0} tests
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest test submissions and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {submissions.slice(0, 5).map((submission) => (
                        <div
                          key={submission._id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => router.push(`/dashboard/submissions/results/${submission._id}`)}
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{submission.testId?.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {submission.testId?.type} • {formatDateTime(submission.submittedAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-medium ${getScoreColor(submission.score)}`}>
                              {submission.score}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDurationHMS(submission.timeSpent)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Assignments</CardTitle>
                  <CardDescription>Tests assigned to this student</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {assignments.map((assignment) => (
                        <div key={assignment._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium">{assignment.testId?.title}</p>
                              <Badge className={getStatusColor(assignment.status)} variant="outline">
                                {getStatusIcon(assignment.status)}
                                <span className="ml-1">{assignment.status}</span>
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {assignment.testId?.type} • {assignment.testId?.duration} minutes
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {assignments.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No assignments found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Test Submissions</CardTitle>
                  <CardDescription>Completed tests and scores</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-3">
                      {submissions.map((submission) => (
                        <div key={submission._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{submission.testId?.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {submission.testId?.type} • Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Time spent: {formatDurationHMS(submission.timeSpent)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${getScoreColor(submission.score)}`}>
                              {submission.score}%
                            </div>
                          </div>
                        </div>
                      ))}
                      {submissions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No submissions found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <Tabs>
            <TabsContent value="answers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Answer Details</CardTitle>
                  <CardDescription>Detailed answers for each test submission</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    <div className="space-y-4">
                      {submissions.map((submission) => (
                        <div key={submission._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-medium">{submission.testId?.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                Score: <span className={`font-medium ${getScoreColor(submission.score)}`}>
                                  {submission.score}%
                                </span>
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/submissions/results/${submission._id}`)}
                            >
                              View Full Results
                            </Button>
                          </div>

                          {submission.answers && (
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Answers Preview:</Label>
                              <div className="grid gap-2 max-h-40 overflow-y-auto">
                                {Array.isArray(submission.answers)
                                  ? submission.answers.slice(0, 5).map((answerObj, index) => (
                                    <div key={answerObj.questionId} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                      <span className="font-medium">Q{index + 1}:</span>
                                      <span className="truncate max-w-xs">{answerObj.answer}</span>
                                      {submission.questionResults?.[index] && (
                                        submission.questionResults[index].isCorrect ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        )
                                      )}
                                    </div>
                                  ))
                                  : Object.entries(submission.answers).slice(0, 5).map(([questionId, answer], index) => (
                                    <div key={questionId} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                      <span className="font-medium">Q{index + 1}:</span>
                                      <span className="truncate max-w-xs">{answer}</span>
                                      {submission.questionResults?.[index] && (
                                        submission.questionResults[index].isCorrect ? (
                                          <CheckCircle className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <XCircle className="h-4 w-4 text-red-600" />
                                        )
                                      )}
                                    </div>
                                  ))
                                }
                                {(Array.isArray(submission.answers)
                                  ? submission.answers.length
                                  : Object.keys(submission.answers).length) > 5 && (
                                    <div className="text-xs text-muted-foreground text-center">
                                      +{(Array.isArray(submission.answers)
                                        ? submission.answers.length
                                        : Object.keys(submission.answers).length) - 5} more answers
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {submissions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No answer details available
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </div>
  );
}