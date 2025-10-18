'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Home,
  BarChart3,
  Timer,
  Brain
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface UserAnswer {
  answer: string;
  score: number;
  isCorrect: boolean;
  maxPoints: number;
}

interface SubQuestion {
  _id: string;
  subQuestionNumber: number;
  question: string;
  subQuestionType: string;
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation?: string;
  userAnswer: UserAnswer;
  isAnswered: boolean;
}

interface MainAnswer {
  answer: string;
  score: number;
  isCorrect: boolean;
  maxPoints: number;
}

interface Question {
  _id: string;
  questionNumber: number;
  question: string;
  type: string;
  subType?: string;
  points: number;
  difficulty?: string;
  passage?: string;
  audioFile?: {
    url: string;
    publicId: string;
    originalName: string;
    format: string;
    bytes: number;
    duration: number;
  };
  instructionText?: string;
  hasSubQuestions: boolean;
  subQuestions?: SubQuestion[];
  options?: string[];
  correctAnswer?: string;
  mainAnswer?: MainAnswer | null;
  subQuestionStats?: {
    totalSubQuestions: number;
    answeredSubQuestions: number;
    correctSubQuestions: number;
    totalSubPoints: number;
    earnedSubPoints: number;
  };
  isAnswered: boolean;
  totalEarnedPoints: number;
}

interface SubmissionStats {
  overall: {
    status: string;
    totalScore: number;
    autoScore: number;
    manualScore: number;
    totalPossiblePoints: number;
    percentage: number;
    isPassed: boolean;
  };
  questions: {
    total: number;
    answered: number;
    unanswered: number;
    completion: number;
  };
  subQuestions: {
    total: number;
    answered: number;
    correct: number;
    incorrect: number;
    accuracy: number;
  };
  mainQuestions: {
    total: number;
    answered: number;
    correct: number;
    incorrect: number;
    accuracy: number;
  } | null;
  timing: {
    startedAt: string;
    submittedAt: string;
    timeTaken: string;
  };
}

interface SubmissionDetail {
  submissionId: string;
  testId: string;
  testTitle: string;
  status: string;
  submittedAt: string;
  startedAt: string;
  stats: SubmissionStats;
  questions: Question[];
  totalQuestions: number;
}

export default function StudentSubmissionResultDetailPage() {
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
      const data = await authService.getSubmissionWithQuestions(submissionId);
      setSubmission(data);
    } catch (error) {
      console.error('Failed to fetch submission:', error);
      setError('Failed to load submission details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
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
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (percentage >= 80) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (percentage >= 70) return { level: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (percentage >= 60) return { level: 'Below Average', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { level: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-50' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              {error || 'Test results not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const performance = getPerformanceLevel(submission.stats.overall.percentage);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/submissions/review-result')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </Button>
        <Button variant="outline" onClick={() => router.push('/submissions')}>
          <Home className="h-4 w-4 mr-2" />
          Home
        </Button>
      </div>

      {/* Test Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6" />
              <div>
                <CardTitle className="text-2xl">{submission.testTitle}</CardTitle>
                <CardDescription className="text-base">
                  Test Results • Submitted {new Date(submission.submittedAt).toLocaleDateString()}
                </CardDescription>
              </div>
            </div>
            {getStatusBadge(submission.status)}
          </div>
        </CardHeader>
      </Card>

      {/* Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Your Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(submission.stats.overall.percentage)}`}>
                {submission.stats.overall.totalScore}
              </div>
              <div className="text-lg text-muted-foreground mb-4">
                out of {submission.stats.overall.totalPossiblePoints} points
              </div>
              <Progress value={submission.stats.overall.percentage} className="h-3 mb-2" />
              <div className="text-lg font-medium">{submission.stats.overall.percentage}%</div>
              <div className={`text-sm mt-1 ${submission.stats.overall.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {submission.stats.overall.isPassed ? '✓ Passed' : '✗ Failed'}
              </div>
            </div>

            <div className={`p-6 rounded-lg ${performance.bg}`}>
              <div className={`text-2xl font-bold mb-4 ${performance.color}`}>
                {performance.level}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Questions Answered:</span>
                  <span className="font-medium">{submission.stats.questions.answered}/{submission.stats.questions.total}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completion Rate:</span>
                  <span className="font-medium">{submission.stats.questions.completion}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Taken:</span>
                  <span className="font-medium">{submission.stats.timing.timeTaken}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span className="font-medium">{submission.stats.subQuestions.accuracy}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Accuracy</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(submission.stats.overall.percentage)}`}>
              {submission.stats.overall.percentage}%
            </div>
            <p className="text-xs text-muted-foreground">Score percentage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {submission.stats.questions.completion}%
            </div>
            <p className="text-xs text-muted-foreground">Questions completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sub-Questions</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {submission.stats.subQuestions.correct}/{submission.stats.subQuestions.total}
            </div>
            <p className="text-xs text-muted-foreground">{submission.stats.subQuestions.accuracy}% accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Main Questions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {submission.stats.mainQuestions ? (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {submission.stats.mainQuestions.correct}/{submission.stats.mainQuestions.total}
                </div>
                <p className="text-xs text-muted-foreground">{submission.stats.mainQuestions.accuracy}% accuracy</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-gray-400">N/A</div>
                <p className="text-xs text-muted-foreground">No main questions</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Question Review */}
      <Card>
        <CardHeader>
          <CardTitle>Question by Question Review</CardTitle>
          <CardDescription>
            Review your answers and see where you can improve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[800px] pr-4">
            <div className="space-y-6">
              {submission.questions.map((question) => (
                <div key={question._id} className={`border rounded-lg p-4 bg-white ${question.totalEarnedPoints > 0 ? 'border-green-300' : 'border-red-300'
                  }`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium flex items-center gap-2">
                      Question {question.questionNumber}: {question.question}
                      {question.isAnswered ? (
                        question.totalEarnedPoints > 0 ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                      )}
                    </h4>
                    <div className="text-right">
                      <div className={`font-medium ${question.totalEarnedPoints > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {question.totalEarnedPoints}/{question.points} points
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {question.type}
                        </Badge>
                        {question.difficulty && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {question.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  {question.instructionText && (
                    <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <strong className="text-blue-800">Instructions:</strong> {question.instructionText}
                    </div>
                  )}

                  {/* Passage for Reading */}
                  {question.passage && (
                    <div className="mb-4 p-4 bg-white border rounded-lg">
                      <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Reading Passage:
                      </h5>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{question.passage}</p>
                    </div>
                  )}

                  {/* Audio for Listening */}
                  {question.audioFile && (
                    <div className="mb-4 p-4 bg-white border rounded-lg">
                      <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Audio File:
                      </h5>
                      <audio controls className="w-full">
                        <source src={question.audioFile.url} type={`audio/${question.audioFile.format}`} />
                        Your browser does not support the audio element.
                      </audio>
                      <p className="text-xs text-muted-foreground mt-2">
                        {question.audioFile.originalName} • {Math.floor(question.audioFile.duration / 60)}:{String(Math.floor(question.audioFile.duration % 60)).padStart(2, '0')} min
                      </p>
                    </div>
                  )}

                  {/* Sub-questions */}
                  {question.hasSubQuestions && question.subQuestions && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground mb-2">
                        Sub-questions ({question.subQuestionStats?.correctSubQuestions}/{question.subQuestionStats?.totalSubQuestions} correct)
                      </div>
                      {question.subQuestions.map((subQ) => (
                        <div key={subQ._id} className="bg-white rounded-lg p-4 border">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {question.questionNumber}.{subQ.subQuestionNumber}
                              </span>
                              {subQ.userAnswer.isCorrect ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <Badge variant="outline" className="text-xs">
                                {subQ.subQuestionType}
                              </Badge>
                            </div>
                            <div className={`text-sm font-medium ${subQ.userAnswer.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              {subQ.userAnswer.score}/{subQ.points} pts
                            </div>
                          </div>

                          <div className="text-sm mb-2">
                            <strong>Question:</strong> {subQ.question}
                          </div>

                          {/* Show options for multiple choice */}
                          {subQ.options && subQ.options.length > 0 && (
                            <div className="text-xs text-muted-foreground mb-2">
                              <strong>Options:</strong> {subQ.options.join(', ')}
                            </div>
                          )}

                          <div className="grid gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Your Answer:</span>
                              <span className={`ml-2 font-medium ${subQ.userAnswer.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                {subQ.userAnswer.answer}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Correct Answer:</span>
                              <span className="ml-2 font-medium text-green-700">
                                {subQ.correctAnswer}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main answer (for non-sub-question types) */}
                  {!question.hasSubQuestions && question.mainAnswer && (
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="grid gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Your Answer:</span>
                          <span className={`ml-2 font-medium ${question.mainAnswer.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {question.mainAnswer.answer}
                          </span>
                        </div>
                        {question.correctAnswer && (
                          <div>
                            <span className="text-muted-foreground">Correct Answer:</span>
                            <span className="ml-2 font-medium text-green-700">
                              {question.correctAnswer}
                            </span>
                          </div>
                        )}
                        {question.options && (
                          <div>
                            <span className="text-muted-foreground">Options:</span>
                            <span className="ml-2">
                              {question.options.join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!question.isAnswered && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                      <div className="flex items-center gap-2 text-yellow-700">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Question not answered</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Test Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{submission.stats.overall.autoScore}</div>
              <div className="text-sm text-muted-foreground">Auto Score</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{submission.stats.overall.manualScore}</div>
              <div className="text-sm text-muted-foreground">Manual Score</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{submission.stats.overall.totalScore}</div>
              <div className="text-sm text-muted-foreground">Total Score</div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Started At:</span>
                <span className="font-medium">
                  {new Date(submission.startedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Submitted At:</span>
                <span className="font-medium">
                  {new Date(submission.submittedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Taken:</span>
                <span className="font-medium">{submission.stats.timing.timeTaken}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Questions:</span>
                <span className="font-medium">{submission.stats.questions.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Questions Answered:</span>
                <span className="font-medium">{submission.stats.questions.answered}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unanswered:</span>
                <span className="font-medium text-red-600">{submission.stats.questions.unanswered}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
