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
import { AudioPlayer } from '@/components/ui/audio-player';

interface Question {
  _id: string;
  number?: number;
  type: string;
  subType?: string;
  prompt?: string;
  question?: string;
  options?: string[];
  paragraphRef?: string;
  correctAnswer?: string;
  points?: number;
  audioFile?: {
    url: string;
    publicId?: string;
    originalName?: string;
    format?: string;
    bytes?: number;
    duration?: number;
  };
  imageFile?: {
    url: string;
    publicId?: string;
    originalName?: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
  };
  section?: number;
  instructionText?: string;
  wordLimit?: number;
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
  questionSections?: any[];
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
  const [questionIndex, setQuestionIndex] = useState<Record<string, any>>({});
  const questionIndexMap = questionIndex;
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questionRefs = useState<Record<string, HTMLDivElement | null>>(() => ({}))[0];

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
      // Prefetch questions by ID if questionSections present
      const ids: string[] = [];
      (data?.testId?.passages || []).forEach((p: any) => {
        (p?.questionSections || []).forEach((s: any) => {
          (s?.questions || []).forEach((q: any) => { if (typeof q === 'string') ids.push(q); });
        });
      });
      // Also handle direct questions (not in passages)
      (data?.testId?.questions || []).forEach((q: any) => {
        if (typeof q === 'string') ids.push(q);
      });
      const unique = Array.from(new Set(ids));
      const idx: Record<string, any> = {};
      await Promise.all(unique.map(async (id) => {
        try { idx[id] = await authService.apiRequest(`/questions/${id}`); } catch { }
      }));
      setQuestionIndex(idx);
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

  // Build question map from passages (supports questionSections with IDs and legacy sections without IDs)
  const questionMap = new Map<string, { question: any; passage: any; section: any }>();
  
  // Handle passages with questions
  (result.testId.passages || []).forEach((passage: any) => {
    if (passage?.questionSections?.length) {
      passage.questionSections.forEach((section: any) => {
        (section.questions || []).forEach((q: any) => {
          const question = typeof q === 'string' ? questionIndex[q] : q;
          if (question?._id) questionMap.set(question._id, { question, passage, section });
        });
      });
    }
    if (passage?.sections?.length) {
      passage.sections.forEach((section: any) => {
        (section.questions || []).forEach((question: any) => {
          // Map by existing _id if present
          if (question?._id) questionMap.set(question._id, { question, passage, section });
          // Also map by composite id format used in submissions when _id is absent: `${passageId}-${sectionId}-${number}`
          if (!question?._id && passage?._id && section?._id && (question?.number != null)) {
            const compositeId = `${passage._id}-${section._id}-${question.number}`;
            questionMap.set(compositeId, { question, passage, section });
          }
        });
      });
    }
  });

  // Handle direct questions (not in passages) - for listening/writing tests
  (result.testId.questions || []).forEach((q: any) => {
    const question = typeof q === 'string' ? questionIndex[q] : q;
    if (question?._id) {
      questionMap.set(question._id, { question, passage: null, section: null });
    }
  });

  // Helper to convert correctAnswer label (A,B,C,D) to actual option value
  const getCorrectAnswerDisplay = (question: any) => {
    const correctAnswer = question?.correctAnswer ?? question?.answer;
    if (!correctAnswer) {
      // For matching-information type, use paragraphRef
      if (question?.subType === 'matching-information' || question?.type === 'matching-information') {
        return question?.paragraphRef ? `Paragraph ${question.paragraphRef}` : undefined;
      }
      return undefined;
    }

    // If question has options and correctAnswer is a single letter (A, B, C, D), convert to actual value
    if (question?.options && Array.isArray(question.options) && /^[A-Z]$/.test(correctAnswer.trim())) {
      const index = correctAnswer.trim().charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
      if (index >= 0 && index < question.options.length) {
        return question.options[index];
      }
    }

    // Otherwise return as-is
    return correctAnswer;
  };

  // Helpers for correctness
  const normalize = (v: any) => (v ?? '').toString().trim().toLowerCase();
  const computeCorrectness = (q: any, a: any) => {
    const correctDisplay = getCorrectAnswerDisplay(q);
    if (correctDisplay == null) return false;
    return normalize(a?.answer) === normalize(correctDisplay);
  };

  // Match answers with questions
  result.answers.forEach(answer => {
    const questionData = questionMap.get(answer.questionId);
    if (!questionData) return;
    const { question, passage, section } = questionData;
    const isCorrect = computeCorrectness(question, answer);
    questionsWithAnswers.push({ question, answer, passage, section, isCorrect });
  });

  // Calculate total questions from test structure
  let totalQuestionsInTest = 0;
  
  // Count questions from passages
  (result.testId.passages || []).forEach((passage: any) => {
    if (passage?.questionSections?.length) {
      passage.questionSections.forEach((section: any) => {
        totalQuestionsInTest += (section.questions || []).length;
      });
    }
    if (passage?.sections?.length) {
      passage.sections.forEach((section: any) => {
        totalQuestionsInTest += (section.questions || []).length;
      });
    }
  });
  
  // Count direct questions (not in passages)
  totalQuestionsInTest += (result.testId.questions || []).length;

  // Calculate statistics
  const totalQuestions = totalQuestionsInTest;
  const answeredQuestions = result.answers.length;
  const skippedQuestions = totalQuestions - answeredQuestions;
  const correctAnswers = questionsWithAnswers.filter(qa => qa.isCorrect).length;
  const totalTimeSpent = result.answers.reduce((acc, answer) => acc + answer.timeSpent, 0);
  const averageTimePerQuestion = answeredQuestions > 0 ? totalTimeSpent / answeredQuestions : 0;

  // Build complete question list for navigation
  const allQuestionsForNav: Array<{ id: string; number: number; status: 'correct' | 'incorrect' | 'skipped' }> = [];
  let questionNumber = 1;

  // Add direct questions
  (result.testId.questions || []).forEach((q: any) => {
    const question = typeof q === 'string' ? questionIndexMap[q] : q;
    if (!question) return;
    const answer = result.answers.find(a => a.questionId === question._id);
    const qa = questionsWithAnswers.find(qa => qa.question._id === question._id);
    allQuestionsForNav.push({
      id: question._id,
      number: questionNumber++,
      status: !answer ? 'skipped' : qa?.isCorrect ? 'correct' : 'incorrect'
    });
  });

  // Add passage questions
  (result.testId.passages || []).forEach((passage: any) => {
    const sections = passage?.questionSections || passage?.sections || [];
    sections.forEach((section: any) => {
      (section.questions || []).forEach((q: any) => {
        const question = typeof q === 'string' ? questionIndexMap[q] : q;
        if (!question) return;
        const qId = question._id || `${passage._id}-${section._id}-${question.number}`;
        const answer = result.answers.find(a => a.questionId === qId);
        const qa = questionsWithAnswers.find(qa => qa.question._id === qId || `${passage._id}-${section._id}-${question.number}` === qa.answer?.questionId);
        allQuestionsForNav.push({
          id: qId,
          number: questionNumber++,
          status: !answer ? 'skipped' : qa?.isCorrect ? 'correct' : 'incorrect'
        });
      });
    });
  });

  const scrollToQuestion = (questionId: string, index: number) => {
    setCurrentQuestionIndex(index);
    const element = questionRefs[questionId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
                <CardTitle className="text-sm font-medium">Questions Status</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {correctAnswers}/{totalQuestions}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>{answeredQuestions} answered • {skippedQuestions} skipped</div>
                  <div>{totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(0) : 0}% accuracy</div>
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
              <div className="grid gap-6 lg:grid-cols-4">
                {/* Main Content Area */}
                <div className="lg:col-span-3">
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
                      {/* Direct Questions (no passages) - for listening/writing tests */}
                      {result.testId.questions && result.testId.questions.length > 0 && (
                        <div className="space-y-4">
                          <div className="border-l-4 border-primary pl-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                              {getTypeIcon(result.testId.type)}
                              {result.testId.title}
                            </h3>
                          </div>

                          <div className="space-y-3">
                            {result.testId.questions.map((q: any, qIndex: number) => {
                              const question: any = typeof q === 'string' ? questionIndexMap[q] : q;
                              if (!question) return null;
                              
                              const answer = result.answers.find(a => a.questionId === question._id);
                              const questionWithAnswer = questionsWithAnswers.find(qa => qa.question._id === question._id);
                              const isCorrect = questionWithAnswer?.isCorrect || false;
                              const correctDisplay = getCorrectAnswerDisplay(question);

                              return (
                                <div 
                                  key={question._id || qIndex} 
                                  ref={(el) => { if (el) questionRefs[question._id] = el; }}
                                  className="border rounded-lg p-4 space-y-4"
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-medium">Question {qIndex + 1}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {(question.subType || question.type || '').replace(/-/g, ' ')}
                                      </Badge>
                                      {question.section && (
                                        <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                                          Section {question.section}
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {question.points || 1} {question.points === 1 ? 'point' : 'points'}
                                      </Badge>
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

                                  {/* Audio Player for Listening Questions */}
                                  {question.audioFile?.url && question.type === 'listening' && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <Volume2 className="h-4 w-4 text-purple-600" />
                                        <span className="text-sm font-medium">Audio</span>
                                      </div>
                                      <AudioPlayer
                                        src={question.audioFile.url}
                                        title={question.audioFile.originalName || 'Question Audio'}
                                        showDownload={false}
                                        className="w-full"
                                      />
                                    </div>
                                  )}

                                  {/* Image for Questions with imageFile */}
                                  {question.imageFile?.url && (
                                    <div className="space-y-2">
                                      <span className="text-sm font-medium">Reference Image</span>
                                      <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                        <img
                                          src={question.imageFile.url}
                                          alt={question.imageFile.originalName || 'Question image'}
                                          className="w-full h-auto max-h-96 object-contain"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div className="space-y-3">
                                    <div>
                                      <p className="font-medium text-sm mb-2">Question:</p>
                                      <p className="text-sm">{question.question || question.prompt}</p>
                                      {question.instructionText && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">{question.instructionText}</p>
                                      )}
                                      {question.wordLimit && (
                                        <Badge variant="outline" className="mt-2 text-xs border-blue-300 text-blue-700">
                                          Word limit: {question.wordLimit}
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Options for Multiple Choice */}
                                    {question.options && question.options.length > 0 && (
                                      <div>
                                        <p className="font-medium text-sm mb-1">Options:</p>
                                        <div className="space-y-1">
                                          {question.options.map((option: string, idx: number) => (
                                            <div
                                              key={idx}
                                              className={`p-2 rounded text-sm border ${
                                                option === answer?.answer && option === correctDisplay
                                                  ? 'bg-green-50 border-green-300 text-green-800'
                                                  : option === answer?.answer
                                                  ? 'bg-red-50 border-red-300 text-red-800'
                                                  : option === correctDisplay
                                                  ? 'bg-green-50 border-green-300 text-green-800'
                                                  : 'bg-white border-slate-200'
                                              }`}
                                            >
                                              <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                                              {option}
                                              {option === correctDisplay && (
                                                <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <p className="font-medium text-sm mb-1">Your Answer:</p>
                                        <div className={`p-2 rounded text-sm ${
                                          isCorrect
                                            ? 'bg-green-50 text-green-800 border border-green-200'
                                            : 'bg-red-50 text-red-800 border border-red-200'
                                        }`}>
                                          {answer?.answer || 'No answer provided'}
                                        </div>
                                      </div>

                                      {correctDisplay && (
                                        <div>
                                          <p className="font-medium text-sm mb-1">Correct Answer:</p>
                                          <div className="p-2 rounded text-sm bg-green-50 text-green-800 border border-green-200">
                                            {correctDisplay}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                                      <span>Status: <span className={isCorrect ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                                        {isCorrect ? 'Correct ✓' : 'Incorrect ✗'}
                                      </span></span>
                                      <span>Time spent: {formatTime(answer?.timeSpent || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Group by passage */}
                      {result.testId.passages && result.testId.passages.length > 0 && result.testId.passages.map((passage, passageIndex) => (
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

                          {/* Sections - prefer questionSections if present */}
                          {(passage.questionSections || passage.sections || []).map((section: any, sectionIndex: number) => (
                            <div key={section._id} className="ml-4 space-y-3">
                              <div className="bg-accent/20 p-3 rounded-lg">
                                <h4 className="font-medium">{section.title || section.name}</h4>
                                <div className="text-xs text-muted-foreground">
                                  {section.questionRange ? (
                                    <span>Questions {section.questionRange}</span>
                                  ) : (
                                    section.range && <span>Questions {section.range.start}-{section.range.end}</span>
                                  )}
                                </div>
                                {section.instructions && (
                                  <p className="text-sm text-muted-foreground mt-1">{section.instructions}</p>
                                )}
                              </div>

                              {/* Questions in this section */}
                              {(section.questions || []).map((q: any, questionIndex: number) => {
                                const question: any = typeof q === 'string' ? questionIndexMap[q] : q;
                                if (!question) return null;
                                const answer = result.answers.find(a => a.questionId === question._id || a.questionId === `${passage._id}-${section._id}-${question.number}`);
                                const questionWithAnswer = questionsWithAnswers.find(qa => qa.question._id === question._id || `${passage._id}-${section._id}-${question.number}` === (qa.answer?.questionId));
                                const isCorrect = questionWithAnswer?.isCorrect || false;
                                const correctDisplay = getCorrectAnswerDisplay(question);
                                const qId = question._id || `${passage._id}-${section._id}-${question.number}`;

                                return (
                                  <div 
                                    key={qId}
                                    ref={(el) => { if (el) questionRefs[qId] = el; }}
                                    className="ml-4 border rounded-lg p-4"
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">Question {question.number || question.questionNumber}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {(question.subType || question.type).replace('-', ' ')}
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
                                        <p className="text-sm">{question.prompt || question.question}</p>
                                      </div>

                                      {/* Options for Multiple Choice */}
                                      {question.options && question.options.length > 0 && (
                                        <div>
                                          <p className="font-medium text-sm mb-1">Options:</p>
                                          <div className="space-y-1">
                                            {question.options.map((option: string, idx: number) => (
                                              <div
                                                key={idx}
                                                className={`p-2 rounded text-sm border ${
                                                  option === answer?.answer && option === correctDisplay
                                                    ? 'bg-green-50 border-green-300 text-green-800'
                                                    : option === answer?.answer
                                                    ? 'bg-red-50 border-red-300 text-red-800'
                                                    : option === correctDisplay
                                                    ? 'bg-green-50 border-green-300 text-green-800'
                                                    : 'bg-white border-slate-200'
                                                }`}
                                              >
                                                <span className="font-medium mr-2">{String.fromCharCode(65 + idx)}.</span>
                                                {option}
                                                {option === correctDisplay && (
                                                  <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

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

                                        {correctDisplay && (
                                          <div>
                                            <p className="font-medium text-sm mb-1">Correct Answer:</p>
                                            <div className="p-2 rounded text-sm bg-green-50 text-green-800 border border-green-200">
                                              {correctDisplay}
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
                </div>

                {/* Question Navigation Sidebar */}
                <div className="lg:col-span-1">
                  <Card className="border-slate-200 shadow-sm sticky top-6">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3">
                      <CardTitle className="text-slate-900 text-base">Questions</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4 pb-4">
                      <ScrollArea className="h-[320px] pr-3">
                        <div className="grid grid-cols-5 gap-1.5">
                          {allQuestionsForNav.map((q, index) => {
                            const isCurrent = currentQuestionIndex === index;
                            return (
                              <Button
                                key={q.id}
                                variant={isCurrent ? "default" : "outline"}
                                size="sm"
                                className={`h-8 w-8 p-0 text-xs font-semibold transition-all ${
                                  isCurrent
                                    ? 'bg-[#004875] hover:bg-[#003a5c] text-white border-[#004875] shadow-md'
                                    : q.status === 'correct'
                                    ? 'bg-green-50 border-green-400 text-green-700 hover:bg-green-100'
                                    : q.status === 'incorrect'
                                    ? 'bg-red-50 border-red-400 text-red-700 hover:bg-red-100'
                                    : 'bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100'
                                }`}
                                onClick={() => scrollToQuestion(q.id, index)}
                              >
                                {q.number}
                              </Button>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                          <div className="w-3 h-3 bg-green-50 border-2 border-green-400 rounded"></div>
                          <span className="font-medium">Correct ({allQuestionsForNav.filter(q => q.status === 'correct').length})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                          <div className="w-3 h-3 bg-red-50 border-2 border-red-400 rounded"></div>
                          <span className="font-medium">Incorrect ({allQuestionsForNav.filter(q => q.status === 'incorrect').length})</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                          <div className="w-3 h-3 bg-slate-50 border-2 border-slate-300 rounded"></div>
                          <span className="font-medium">Skipped ({allQuestionsForNav.filter(q => q.status === 'skipped').length})</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
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