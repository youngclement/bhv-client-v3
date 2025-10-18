'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  AlertCircle,
  Timer,
  BarChart3,
  Brain,
  Download,
  Headphones
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface SubQuestion {
  subQuestionId: string;
  subQuestionNumber: number;
  subQuestionType: string;
  question: string;
  correctAnswer: string;
  studentAnswer: string;
  isAnswered: boolean;
  isCorrect: boolean;
  points: number;
  earnedPoints: number;
}

interface Question {
  questionId: string;
  questionNumber: number;
  type: string;
  question: string;
  hasSubQuestions: boolean;
  subQuestions?: SubQuestion[];
  subQuestionsStats?: {
    total: number;
    answered: number;
    correct: number;
    totalPoints: number;
    earnedPoints: number;
    accuracy: number;
  };
}

interface DetailedComparisonResponse {
  message: string;
  data: {
    submission: {
      _id: string;
      status: string;
      totalScore: number;
      autoScore: number;
      manualScore: number;
      isFullyGraded: boolean;
      startedAt: string;
      submittedAt: string;
    };
    test: {
      _id: string;
      title: string;
      type: string;
      duration: number;
      totalPoints: number;
    };
    student: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    assignment: {
      _id: string;
      dueDate: string;
    } | null;
    statistics: {
      overall: {
        totalPossiblePoints: number;
        earnedPoints: number;
        percentage: number;
        isPassed: boolean;
        grade: string;
      };
      questions: {
        total: number;
        answered: number;
      };
      subQuestions: {
        total: number;
        answered: number;
        correct: number;
        incorrect: number;
        accuracy: number;
      };
      timing: {
        startedAt: string;
        submittedAt: string;
        timeTakenMinutes: number;
        allowedDuration: number;
      };
    };
    questions: Question[];
  };
}

export default function TeacherSubmissionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params.submissionId as string;

  const [data, setData] = useState<DetailedComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (submissionId) {
      fetchDetailedComparison();
    }
  }, [submissionId]);

  const fetchDetailedComparison = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(
        `${authService.getBaseUrl()}/submissions/${submissionId}/detailed-comparison`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch detailed comparison');

      const responseData: DetailedComparisonResponse = await response.json();
      setData(responseData);
    } catch (error) {
      console.error('Failed to fetch submission details:', error);
      setError('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, any> = {
      'submitted': {
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle,
        label: 'Submitted'
      },
      'graded': {
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Award,
        label: 'Graded'
      },
      'pending-grading': {
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        icon: Clock,
        label: 'Pending Grading'
      },
      'in-progress': {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: AlertCircle,
        label: 'In Progress'
      }
    };

    const config = statusConfig[status] || {
      className: 'bg-gray-100 text-gray-800',
      icon: FileText,
      label: status
    };

    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800 border-green-300';
      case 'B': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'C': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'D': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'F': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTestTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      reading: BookOpen,
      listening: Headphones,
      writing: FileText,
      speaking: FileText,
      full: Target
    };
    const Icon = icons[type] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading detailed submission data...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
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
              {error || 'Submission details not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { submission, test, student, assignment, statistics, questions } = data.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push('/dashboard/submissions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Submissions
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Student & Test Info Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">
                  {student.firstName} {student.lastName}
                </CardTitle>
                <CardDescription className="text-sm">
                  {student.email}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Test Info */}
          <div className="flex items-center gap-2 pb-3 border-b">
            {getTestTypeIcon(test.type)}
            <div className="flex-1">
              <div className="font-medium text-sm">{test.title}</div>
              <div className="text-xs text-muted-foreground capitalize">
                {test.type} Test • {test.duration} minutes
              </div>
            </div>
          </div>

          {/* Time Info */}
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Started At</div>
              <div className="font-medium text-sm">
                {new Date(statistics.timing.startedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(statistics.timing.startedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Submitted At</div>
              <div className="font-medium text-sm">
                {new Date(statistics.timing.submittedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(statistics.timing.submittedAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">Time Taken</div>
              <div className="font-medium text-sm">
                {statistics.timing.timeTakenMinutes} minutes
              </div>
              <div className="text-xs text-muted-foreground">
                of {statistics.timing.allowedDuration}m ({((statistics.timing.timeTakenMinutes / statistics.timing.allowedDuration) * 100).toFixed(0)}%)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Overview */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Overall Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="text-center space-y-4">
              <div>
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(statistics.overall.percentage)}`}>
                  {statistics.overall.earnedPoints}
                </div>
                <div className="text-lg text-muted-foreground">
                  out of {statistics.overall.totalPossiblePoints} points
                </div>
              </div>
              <div className="space-y-2">
                <Progress value={statistics.overall.percentage} className="h-3" />
                <div className="flex items-center justify-between text-sm">
                  <span className={`font-bold text-lg ${getScoreColor(statistics.overall.percentage)}`}>
                    {statistics.overall.percentage}%
                  </span>
                  <Badge variant="outline" className={`text-lg font-bold ${getGradeColor(statistics.overall.grade)}`}>
                    Grade: {statistics.overall.grade}
                  </Badge>
                </div>
              </div>
              <div className={`text-sm font-medium ${statistics.overall.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {statistics.overall.isPassed ? '✓ Passed' : '✗ Failed'}
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Auto Score</span>
                  <span className="text-2xl font-bold text-blue-600">{submission.autoScore}</span>
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-purple-900">Manual Score</span>
                  <span className="text-2xl font-bold text-purple-600">{submission.manualScore}</span>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">Total Score</span>
                  <span className="text-2xl font-bold text-green-600">{submission.totalScore}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.questions.answered}/{statistics.questions.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Questions answered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sub-Questions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {statistics.subQuestions.correct}/{statistics.subQuestions.total}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.subQuestions.accuracy}% accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Taken</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.timing.timeTakenMinutes}m
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {statistics.timing.allowedDuration}m allowed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(statistics.overall.percentage)}`}>
              {statistics.overall.percentage}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall accuracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Question Review */}
      <Card>
        <CardHeader>
          <CardTitle>Question by Question Analysis</CardTitle>
          <CardDescription>
            Detailed breakdown of all questions and answers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[800px] pr-4">
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div
                  key={question.questionId}
                // className={`border rounded-lg p-5 bg-white ${question.subQuestionsStats
                //   ? question.subQuestionsStats.earnedPoints > 0
                //     ? 'border-green-300'
                //     : 'border-red-300'
                //   : 'border-gray-300'
                //   }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {question.questionNumber}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg">{question.question}</h4>
                        <Badge variant="outline" className="mt-1 capitalize">
                          {question.type}
                        </Badge>
                      </div>
                    </div>
                    {question.subQuestionsStats && (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${question.subQuestionsStats.earnedPoints > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                          {question.subQuestionsStats.earnedPoints}/{question.subQuestionsStats.totalPoints}
                        </div>
                        <div className="text-sm text-muted-foreground">points</div>
                      </div>
                    )}
                  </div>

                  {/* Sub-questions */}
                  {question.hasSubQuestions && question.subQuestions && (
                    <div className="space-y-3 ml-4">
                      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground mb-3">
                        <span>Sub-questions</span>
                        <span>
                          {question.subQuestionsStats?.correct}/{question.subQuestionsStats?.total} correct
                          ({question.subQuestionsStats?.accuracy}%)
                        </span>
                      </div>

                      {question.subQuestions.map((subQ) => (
                        <div
                          key={subQ.subQuestionId}
                          className={` rounded-lg p-4 border ${subQ.isCorrect ? 'border-green-300' : 'border-red-300'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold">
                                {question.questionNumber}.{subQ.subQuestionNumber}
                              </span>
                              {subQ.isCorrect ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <Badge variant="outline" className="text-xs capitalize">
                                {subQ.subQuestionType.replace(/-/g, ' ')}
                              </Badge>
                            </div>
                            <div className={`text-sm font-bold ${subQ.isCorrect ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {subQ.earnedPoints}/{subQ.points} pts
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="text-sm font-medium mb-1">Question:</div>
                              <div className="text-sm">{subQ.question}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Student Answer
                                </div>
                                <div className={`p-2 rounded text-sm font-medium ${subQ.isCorrect
                                  ? 'bg-green-100 text-green-800 border border-green-300'
                                  : 'bg-red-100 text-red-800 border border-red-300'
                                  }`}>
                                  {subQ.isAnswered ? subQ.studentAnswer : 'Not answered'}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                  Correct Answer
                                </div>
                                <div className="p-2 rounded text-sm font-medium bg-green-100 text-green-800 border border-green-300">
                                  {subQ.correctAnswer}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
