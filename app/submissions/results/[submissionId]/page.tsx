'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  BookOpen,
  Volume2,
  PenTool,
  Target,
  TrendingUp,
  Home
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { format } from 'date-fns';

interface QuestionResult {
  _id: string;
  question: string;
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
  earnedPoints: number;
  timeSpent: number;
  feedback?: string;
  passage?: string;
}

interface SubmissionResult {
  _id: string;
  testId: {
    _id: string;
    title: string;
    type: string;
    duration: number;
  };
  score: number;
  totalPoints: number;
  earnedPoints: number;
  submittedAt: string;
  timeSpent: number;
  status: 'completed';
  questionResults: QuestionResult[];
  feedback?: {
    overall: string;
    strengths: string[];
    improvements: string[];
  };
}

export default function TestResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResults = useCallback(async (submissionId: string) => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Check for immediate submission result in sessionStorage first
      const immediateResult = sessionStorage.getItem(`submission_result_${submissionId}`);
      if (immediateResult) {
        const parsedResult = JSON.parse(immediateResult);
        console.log('Using immediate submission result:', parsedResult);
        
        // Create a simplified result object for immediate display
        const quickResult: SubmissionResult = {
          _id: submissionId,
          score: parsedResult.score,
          totalPoints: parsedResult.totalPoints,
          earnedPoints: parsedResult.score, // Assuming score is the earned points
          submittedAt: parsedResult.submittedAt,
          timeSpent: 0, // Will be updated by full API call
          status: 'completed',
          questionResults: [], // Will be populated by full API call
          testId: { _id: '', title: 'Test Results', type: 'mixed', duration: 0 }
        };
        
        setResult(quickResult);
        // Clean up sessionStorage
        sessionStorage.removeItem(`submission_result_${submissionId}`);
      }

      // Fetch full submission results
      const data = await authService.apiRequest(`/submissions/${submissionId}`);
      console.log('Raw submission data:', data);

      // Transform API data if needed
      const formattedResult = {
        ...data,
        // Map API data structure to our component's expected structure
        questionResults: Array.isArray(data.answers)
          ? data.answers.map((answer: any, index: number) => {
            console.log(`Processing answer ${index}:`, answer);
            return {
              _id: answer.questionId?._id || answer.questionId,
              question: answer.questionId?.question || `Question ${index + 1}`,
              type: answer.questionId?.type || data.testId?.type || 'unknown',
              subType: answer.questionId?.subType || 'unknown',
              userAnswer: answer.answer,
              correctAnswer: answer.questionId?.correctAnswer || 'Unknown',
              isCorrect: answer.answer === answer.questionId?.correctAnswer,
              points: answer.questionId?.points || 1,
              earnedPoints: answer.answer === answer.questionId?.correctAnswer ? (answer.questionId?.points || 1) : 0,
              timeSpent: answer.timeSpent || 0,
              feedback: '',
              passage: answer.questionId?.passage || ''
            };
          })
          : []
      };

      console.log('Formatted result:', formattedResult);
      setResult(formattedResult);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      router.push('/submissions');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (params.submissionId) {
      fetchResults(params.submissionId as string);
    }
  }, [params.submissionId, fetchResults]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 80) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'listening': return <Volume2 className="h-4 w-4" />;
      case 'writing': return <PenTool className="h-4 w-4" />;
      default: return null;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeSpent = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Results not found</p>
          <Button onClick={() => router.push('/submissions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tests
          </Button>
        </div>
      </div>
    );
  }

  const correctAnswers = result.questionResults?.filter(q => q.isCorrect).length || 0;
  const totalQuestions = result.questionResults?.length || 0;
  const averageTimePerQuestion = totalQuestions > 0 ? result.timeSpent / totalQuestions : 0;

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
                <h1 className="text-xl font-semibold">Test Results</h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push('/submissions')}>
                <Home className="h-4 w-4 mr-2" />
                Back to Tests
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Test Results</h2>
            <p className="text-muted-foreground">Your performance summary and detailed feedback</p>
          </div>

          {/* Score Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {result.earnedPoints}/{result.totalPoints} points
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Correct Answers</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {correctAnswers}/{totalQuestions}
                </div>
                <div className="text-xs text-muted-foreground">
                  {((correctAnswers / totalQuestions) * 100).toFixed(0)}% accuracy
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatTimeSpent(result.timeSpent)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg: {formatTime(averageTimePerQuestion)}/question
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className={getScoreBadgeColor(result.score)} variant="outline">
                  {result.score >= 90 ? 'Excellent' :
                    result.score >= 80 ? 'Very Good' :
                      result.score >= 70 ? 'Good' : 'Needs Improvement'}
                </Badge>
                <div className="mt-2 h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, result.score))}%` }} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Test Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(result.testId.type)}
                  <div>
                    <CardTitle>{result.testId.title}</CardTitle>
                    <CardDescription>
                      Completed on {format(new Date(result.submittedAt), 'PPP')} at {format(new Date(result.submittedAt), 'p')}
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs defaultValue="questions" className="space-y-6">
            <TabsList>
              <TabsTrigger value="questions">Question Review ({totalQuestions})</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>

            <TabsContent value="questions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Question by Question Review</CardTitle>
                  <CardDescription>
                    Detailed breakdown of your answers and performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[70vh]">
                    <div className="space-y-4">
                      {result.questionResults?.map((questionResult, index) => (
                        <div key={questionResult._id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Question {index + 1}</span>
                              <Badge variant="outline" className="text-xs">
                                {questionResult.subType.replace('-', ' ')}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {questionResult.points} point{questionResult.points > 1 ? 's' : ''}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              {questionResult.isCorrect ? (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-600" />
                              )}
                              <span className="text-sm text-muted-foreground">
                                {formatTime(questionResult.timeSpent)}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <p className="font-medium text-sm mb-2">Question:</p>
                              <p className="text-sm">{questionResult.question}</p>
                            </div>

                            {/* Display passage if available */}
                            {questionResult.type === 'reading' && questionResult.passage && (
                              <div className="mb-4">
                                <p className="font-medium text-sm mb-2">Passage:</p>
                                <div className="bg-slate-50 p-3 rounded-md text-sm border">
                                  {questionResult.passage}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="font-medium text-sm mb-1">Your Answer:</p>
                                <div className={`p-2 rounded text-sm ${questionResult.isCorrect
                                  ? 'bg-green-50 text-green-800 border border-green-200'
                                  : 'bg-red-50 text-red-800 border border-red-200'
                                  }`}>
                                  {questionResult.userAnswer || 'No answer provided'}
                                </div>
                              </div>

                              <div>
                                <p className="font-medium text-sm mb-1">Correct Answer:</p>
                                <div className="p-2 rounded text-sm bg-green-50 text-green-800 border border-green-200">
                                  {questionResult.correctAnswer}
                                </div>
                              </div>
                            </div>

                            {questionResult.feedback && (
                              <div>
                                <p className="font-medium text-sm mb-1">Feedback:</p>
                                <p className="text-sm text-muted-foreground bg-blue-50 p-2 rounded border border-blue-200">
                                  {questionResult.feedback}
                                </p>
                              </div>
                            )}

                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Points earned: {questionResult.earnedPoints}/{questionResult.points}</span>
                              <span>Time spent: {formatTime(questionResult.timeSpent)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  {(!result.questionResults || result.questionResults.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      No question results available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              {result.feedback && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Overall Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">{result.feedback.overall}</p>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-green-600">Strengths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.feedback.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-orange-600">Areas for Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {result.feedback.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Target className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}