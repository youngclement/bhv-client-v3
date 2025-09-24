'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

interface Question {
  _id: string;
  number: number;
  type: string;
  prompt: string;
  options?: string[];
  paragraphRef?: string;
  correctAnswer?: string;
  points?: number;
}

interface Section {
  _id: string;
  name: string;
  instructions?: string;
  range: {
    start: number;
    end: number;
  };
  questions: Question[];
}

interface Passage {
  _id: string;
  title: string;
  content: string;
  type: 'reading' | 'listening';
  audioUrl?: string;
  questions: any[];
  sections: Section[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Answer {
  _id: string;
  questionId: string;
  answer: string;
  timeSpent: number;
}

interface SubmissionResult {
  _id: string;
  testId: {
    _id: string;
    title: string;
    description: string;
    type: string;
    duration: number;
    passages: Passage[];
    questions: any[];
    totalPoints: number;
  };
  studentId: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  assignmentId: string;
  answers: Answer[];
  startedAt: string;
  totalPoints: number;
  status: 'completed';
  score: number;
  submittedAt?: string;
  timeSpent?: number;
  createdAt: string;
  updatedAt: string;
}

interface QuestionWithAnswer {
  question: Question;
  answer: Answer;
  passage: Passage;
  section: Section;
  isCorrect: boolean;
}

export default function TestResultsPage() {
  const router = useRouter();
  const params = useParams();
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.submissionId) {
      fetchResults(params.submissionId as string);
    }
  }, [params.submissionId]);

  const fetchResults = async (submissionId: string) => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      const data = await authService.getSubmissionResults(submissionId);
      setResult(data);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      router.push('/submissions');
    } finally {
      setLoading(false);
    }
  };

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

  // Process questions and answers
  const questionsWithAnswers: QuestionWithAnswer[] = [];

  // Build question map from passages
  const questionMap = new Map<string, { question: Question; passage: Passage; section: Section }>();

  result.testId.passages.forEach(passage => {
    passage.sections?.forEach(section => {
      section.questions.forEach(question => {
        questionMap.set(question._id, { question, passage, section });
      });
    });
  });

  // Match answers with questions
  result.answers.forEach(answer => {
    const questionData = questionMap.get(answer.questionId);
    if (questionData) {
      const { question, passage, section } = questionData;

      // Determine if answer is correct using robust comparison
      const normalizeAnswer = (value: unknown) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return String(value);
        if (typeof value !== 'string') return String(value ?? '');
        return value.trim().toLowerCase();
      };

      const compareAnswers = (user: unknown, correct: unknown, type?: string) => {
        if (user === undefined || user === null || correct === undefined || correct === null) return false;
        const u = normalizeAnswer(user);
        const c = normalizeAnswer(correct);
        if (type === 'true-false-not-given') {
          const map = (v: string) => {
            if (v === 'true' || v === 't') return 'true';
            if (v === 'false' || v === 'f') return 'false';
            if (v === 'not given' || v === 'notgiven' || v === 'ng' || v === 'n/a') return 'not given';
            return v;
          };
          return map(u) === map(c);
        }
        return u === c;
      };

      let isCorrect = compareAnswers(answer.answer, question.correctAnswer, question.type);
      if (!isCorrect && question.type === 'matching-information') {
        isCorrect = normalizeAnswer(answer.answer) === normalizeAnswer(question.paragraphRef);
      }

      questionsWithAnswers.push({
        question,
        answer,
        passage,
        section,
        isCorrect
      });
    }
  });

  // Calculate statistics
  const totalQuestions = result.answers.length;
  const correctAnswers = questionsWithAnswers.filter(qa => qa.isCorrect).length;
  const totalTimeSpent = result.answers.reduce((acc, answer) => acc + answer.timeSpent, 0);
  const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

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
                  {correctAnswers}/{totalQuestions} correct
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
                  {totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(0) : 0}% accuracy
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
                  {formatTime(totalTimeSpent)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Avg: {formatTime(Math.floor(averageTimePerQuestion))}/question
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
                <div className="mt-2">
                  <Progress value={result.score} className="h-2" />
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
                      {result.submittedAt ? (
                        <>Completed on {format(new Date(result.submittedAt), 'PPP')} at {format(new Date(result.submittedAt), 'p')}</>
                      ) : (
                        <>Started on {format(new Date(result.startedAt), 'PPP')} at {format(new Date(result.startedAt), 'p')}</>
                      )}
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
                    <div className="space-y-6">
                      {/* Group by passage */}
                      {result.testId.passages.map((passage, passageIndex) => (
                        <div key={passage._id} className="space-y-4">
                          {/* Passage Header */}
                          <div className="border-l-4 border-primary pl-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              {getTypeIcon(passage.type)}
                              {passage.title}
                            </h3>
                            <div className="mt-2 p-4 bg-muted rounded-lg">
                              <p className="text-sm leading-relaxed">
                                {passage.content?.length > 300
                                  ? `${passage.content?.substring(0, 300)}...`
                                  : passage.content}
                              </p>
                            </div>
                          </div>

                          {/* Sections */}
                          {passage.sections?.map((section, sectionIndex) => (
                            <div key={section._id} className="ml-4 space-y-3">
                              <div className="bg-accent/20 p-3 rounded-lg">
                                <h4 className="font-medium">{section.name}</h4>
                                {section.instructions && (
                                  <p className="text-sm text-muted-foreground mt-1">{section.instructions}</p>
                                )}
                              </div>

                              {/* Questions in this section */}
                              {section.questions.map((question, questionIndex) => {
                                const answer = result.answers.find(a => a.questionId === question._id);
                                const questionWithAnswer = questionsWithAnswers.find(qa => qa.question._id === question._id);
                                const isCorrect = questionWithAnswer?.isCorrect || false;

                                return (
                                  <div key={question._id} className="ml-4 border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Question {question.number}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {question.type.replace('-', ' ')}
                                        </Badge>
                                        {question.paragraphRef && (
                                          <Badge variant="outline" className="text-xs">
                                            Paragraph {question.paragraphRef}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isCorrect ? (
                                          <CheckCircle className="h-5 w-5 text-green-600" />
                                        ) : (
                                          <XCircle className="h-5 w-5 text-red-600" />
                                        )}
                                        <span className="text-sm text-muted-foreground">
                                          {formatTime(answer?.timeSpent || 0)}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <p className="font-medium text-sm mb-2">Question:</p>
                                        <p className="text-sm">{question.prompt}</p>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <p className="font-medium text-sm mb-1">Your Answer:</p>
                                          <div className={`p-2 rounded text-sm ${isCorrect
                                            ? 'bg-green-50 text-green-800 border border-green-200'
                                            : 'bg-red-50 text-red-800 border border-red-200'
                                            }`}>
                                            {answer?.answer || 'No answer provided'}
                                          </div>
                                        </div>

                                        {question.type === 'matching-information' && (
                                          <div>
                                            <p className="font-medium text-sm mb-1">Expected:</p>
                                            <div className="p-2 rounded text-sm bg-green-50 text-green-800 border border-green-200">
                                              Paragraph {question.paragraphRef}
                                            </div>
                                          </div>
                                        )}

                                        {question.correctAnswer && (
                                          <div>
                                            <p className="font-medium text-sm mb-1">Correct Answer:</p>
                                            <div className="p-2 rounded text-sm bg-green-50 text-green-800 border border-green-200">
                                              {question.correctAnswer}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>Status: {isCorrect ? 'Correct' : 'Incorrect'}</span>
                                        <span>Time spent: {formatTime(answer?.timeSpent || 0)}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
                        <ul className="space-y-1 text-sm">
                          {result.score >= 80 && (
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              Excellent overall performance
                            </li>
                          )}
                          {correctAnswers > totalQuestions * 0.7 && (
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              Good accuracy rate
                            </li>
                          )}
                          {averageTimePerQuestion < 60 && (
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              Efficient time management
                            </li>
                          )}
                          {totalQuestions > 0 && (
                            <li className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              Completed all questions
                            </li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-orange-600 mb-2">Areas for Improvement</h4>
                        <ul className="space-y-1 text-sm">
                          {result.score < 60 && (
                            <li className="flex items-start gap-2">
                              <Target className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              Focus on improving overall accuracy
                            </li>
                          )}
                          {correctAnswers < totalQuestions * 0.5 && (
                            <li className="flex items-start gap-2">
                              <Target className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              Review question types you struggled with
                            </li>
                          )}
                          {averageTimePerQuestion > 120 && (
                            <li className="flex items-start gap-2">
                              <Target className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              Work on time management skills
                            </li>
                          )}
                          {questionsWithAnswers.some(qa => qa.question.type === 'matching-information' && !qa.isCorrect) && (
                            <li className="flex items-start gap-2">
                              <Target className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                              Practice matching information questions
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}