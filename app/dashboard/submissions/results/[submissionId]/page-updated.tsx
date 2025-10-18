'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BookOpen,
  FileText,
  Target,
  TrendingUp,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface SubmissionAnswer {
  questionId: string;
  subQuestionId?: string;
  subQuestionNumber?: number;
  answer: string;
  score: number;
  _id: string;
}

interface SubmissionDetail {
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

export default function SubmissionResultsPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submissionId as string;
  
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId]);

  const fetchSubmission = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/submissions/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch submission');
      
      const data = await response.json();
      setSubmission(data);
    } catch (error) {
      console.error('Failed to fetch submission:', error);
      setError('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

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
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const calculatePercentage = (score: number, total: number) => {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  // Group answers by question
  const groupedAnswers = submission?.answers.reduce((acc, answer) => {
    const questionId = answer.questionId;
    if (!acc[questionId]) {
      acc[questionId] = [];
    }
    acc[questionId].push(answer);
    return acc;
  }, {} as Record<string, SubmissionAnswer[]>) || {};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading submission...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {error || 'Submission not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = Object.keys(groupedAnswers).length;
  const scorePercentage = calculatePercentage(submission.totalScore, submission.answers.length);
  const duration = submission.submittedAt && submission.startedAt 
    ? Math.round((new Date(submission.submittedAt).getTime() - new Date(submission.startedAt).getTime()) / 60000)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Submission Results</h1>
          <p className="text-muted-foreground">Detailed submission review</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(submission.totalScore, submission.answers.length)}`}>
              {submission.totalScore}
            </div>
            <p className="text-xs text-muted-foreground">
              out of {submission.answers.length} points ({scorePercentage}%)
            </p>
            <Progress value={scorePercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getStatusBadge(submission.status, submission.isTimeout)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {submission.isFullyGraded ? 'Fully graded' : 'Auto-graded only'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{duration}m</div>
            <p className="text-xs text-muted-foreground">
              out of {submission.testId.duration} minutes
            </p>
            <Progress 
              value={Math.min((duration / submission.testId.duration) * 100, 100)} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground">
              Total questions answered
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Student & Test Info */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {submission.userId.firstName.charAt(0)}{submission.userId.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {submission.userId.firstName} {submission.userId.lastName}
                </div>
                <div className="text-sm text-muted-foreground">
                  {submission.userId.email}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                {getTestTypeIcon(submission.testId.type)}
                Test Information
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Title:</span>
                  <span className="ml-2 font-medium">{submission.testId.title}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <span className="ml-2 capitalize">{submission.testId.type}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2">{submission.testId.duration} minutes</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timing
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Started:</span>
                  <span className="ml-2">
                    {new Date(submission.startedAt).toLocaleString()}
                  </span>
                </div>
                {submission.submittedAt && (
                  <div>
                    <span className="text-muted-foreground">Submitted:</span>
                    <span className="ml-2">
                      {new Date(submission.submittedAt).toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Last Saved:</span>
                  <span className="ml-2">
                    {new Date(submission.lastSavedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answers Detail */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Answer Details</CardTitle>
            <CardDescription>
              Review all answers and scores for this submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {Object.entries(groupedAnswers).map(([questionId, answers], index) => (
                  <div key={questionId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <Badge variant="outline">
                        ID: {questionId}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {answers.sort((a, b) => (a.subQuestionNumber || 0) - (b.subQuestionNumber || 0)).map((answer) => (
                        <div key={answer._id} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {answer.subQuestionNumber && (
                                <span className="text-sm font-medium">
                                  Sub-question {answer.subQuestionNumber}
                                </span>
                              )}
                              {answer.score > 0 ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div className={`font-medium ${answer.score > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {answer.score} point{answer.score !== 1 ? 's' : ''}
                            </div>
                          </div>
                          
                          <div className="text-sm">
                            <span className="text-muted-foreground">Answer:</span>
                            <span className="ml-2 font-medium">{answer.answer}</span>
                          </div>
                          
                          {answer.subQuestionId && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Sub-question ID: {answer.subQuestionId}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Score Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Score Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{submission.autoScore}</div>
              <div className="text-sm text-muted-foreground">Auto Score</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{submission.manualScore}</div>
              <div className="text-sm text-muted-foreground">Manual Score</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{submission.totalScore}</div>
              <div className="text-sm text-muted-foreground">Total Score</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}