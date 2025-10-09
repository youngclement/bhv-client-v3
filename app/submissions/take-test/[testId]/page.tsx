'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Save,
  Send,
  BookOpen,
  Volume2,
  PenTool,
  AlertTriangle,
  Home
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { AudioPlayer } from '@/components/ui/audio-player';

interface Question {
  _id: string;
  number?: number;
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  question?: string;
  prompt?: string;
  passage?: string;
  audioUrl?: string;
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
  options?: string[];
  points: number;
  answer?: string;
  timeSpent?: number;
  passageId?: string;
  passageTitle?: string;
  passageContent?: string;
  passageAudioUrl?: string;
  sectionName?: string;
  sectionInstructions?: string;
  paragraphRef?: string;
  section?: number;
  instructionText?: string;
  wordLimit?: number;
  blanksCount?: number;
}

interface Passage {
  _id: string;
  title: string;
  content: string;
  type: 'reading' | 'listening';
  audioUrl?: string;
  questions?: string[]; // legacy
  sections?: Section[]; // legacy
  questionSections?: {
    _id?: string;
    title: string;
    instructions?: string;
    questionType: string;
    questionRange: string;
    questions: string[]; // IDs
  }[];
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

interface Test {
  _id: string;
  title: string;
  description: string;
  type: 'reading' | 'listening' | 'writing' | 'mixed';
  duration: number;
  questions: Question[];
  passages?: Passage[];
}

export default function TakeTestPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [test, setTest] = useState<Test | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [currentPassage, setCurrentPassage] = useState<Passage | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const assignmentId = searchParams.get('assignment');
  const existingSubmissionId = searchParams.get('submission');

  useEffect(() => {
    if (params.testId) {
      initializeTest(params.testId as string);
    }
  }, [params.testId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            if (submissionId) {
              handleSubmitTest();
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, submissionId]);

  const initializeTest = async (testId: string) => {
    try {
      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Fetch test data
      let testData;
      try {
        testData = await authService.apiRequest(`/tests/${testId}`);
      } catch (error) {
        console.error('Failed to fetch test:', error);
        // Don't redirect immediately, show error state
        setLoading(false);
        return;
      }

      setTest(testData);

      // Process passages and fetch questions
      let allQuestions: Question[] = [];

      // Add standalone questions
      if (testData.questions && testData.questions.length > 0) {
        // Process standalone questions (if they exist)
        for (const question of testData.questions) {
          if (typeof question === 'string') {
            // If it's just an ID, fetch the question
            try {
              const questionData = await authService.apiRequest(`/questions/${question}`);
              allQuestions.push({
                ...questionData,
                subType: questionData.subType || questionData.type
              });
            } catch (error) {
              console.error(`Failed to fetch question ${question}:`, error);
            }
          } else {
            // If it's already a question object
            allQuestions.push({
              ...question,
              subType: question.subType || question.type
            });
          }
        }
      }

      // Process passages and their questions
      if (testData.passages && testData.passages.length > 0) {
        for (const passage of testData.passages) {
          // New model: questionSections with question ID arrays
          if (passage.questionSections && passage.questionSections?.length > 0) {
            for (const section of passage.questionSections) {
              if (section.questions && section.questions.length > 0) {
                for (const questionId of section.questions) {
                  try {
                    const questionData = await authService.apiRequest(`/questions/${questionId}`);
                    const questionWithContext: Question = {
                      ...questionData,
                      _id: questionData._id || `${passage._id}-${section._id}-${questionData.number}`,
                      type: passage.type as 'reading' | 'listening' | 'writing',
                      subType: questionData.subType || questionData.type,
                      question: questionData.question || questionData.prompt || '',
                      number: questionData.questionNumber || questionData.number,
                      options: questionData.options || [],
                      points: questionData.points || 1,
                      passageId: passage._id,
                      passageTitle: passage.title,
                      passageContent: passage.content,
                      passageAudioUrl: passage.audioUrl,
                      sectionName: section.title,
                      sectionInstructions: section.instructions,
                      paragraphRef: questionData.paragraphRef
                    };
                    allQuestions.push(questionWithContext);
                  } catch (error) {
                    console.error(`Failed to fetch question ${questionId}:`, error);
                  }
                }
              }
            }
          }
          // Legacy: sections with embedded questions
          else if (passage.sections && passage.sections?.length > 0) {
            for (const section of passage.sections) {
              if (section.questions && section.questions.length > 0) {
                for (const question of section.questions) {
                  const questionWithContext: Question = {
                    ...question,
                    _id: question._id || `${passage._id}-${section._id}-${question.number}`,
                    type: passage.type as 'reading' | 'listening' | 'writing',
                    subType: question.type,
                    question: question.prompt || question.question || '',
                    points: question.points || 1,
                    passageId: passage._id,
                    passageTitle: passage.title,
                    passageContent: passage.content,
                    passageAudioUrl: passage.audioUrl,
                    sectionName: section.name,
                    sectionInstructions: section.instructions,
                    paragraphRef: question.paragraphRef
                  };
                  allQuestions.push(questionWithContext);
                }
              }
            }
          }
          // Process legacy questions array (if exists)
          else if (passage.questions && passage.questions.length > 0) {
            for (const questionId of passage.questions) {
              try {
                const questionData = await authService.apiRequest(`/questions/${questionId}`);
                const questionWithPassage: Question = {
                  ...questionData,
                  subType: questionData.subType || questionData.type,
                  passageId: passage._id,
                  passageTitle: passage.title,
                  passageContent: passage.content,
                  passageAudioUrl: passage.audioUrl,
                };
                allQuestions.push(questionWithPassage);
              } catch (error) {
                console.error(`Failed to fetch question ${questionId}:`, error);
              }
            }
          }
        }
      }

      setAllQuestions(allQuestions);

      // Set current passage for first question
      if (allQuestions.length > 0 && allQuestions[0].passageId) {
        const firstPassage = testData.passages?.find((p: Passage) => p._id === allQuestions[0].passageId);
        setCurrentPassage(firstPassage || null);
      }
      // Start or continue submission
      if (existingSubmissionId) {
        setSubmissionId(existingSubmissionId);
        // Set timer based on remaining time if available
        setTimeRemaining(testData.duration * 60);

        // Load existing answers
        try {
          const submissionData = await authService.getSubmissionResults(existingSubmissionId);
          if (submissionData.answers) {
            setAnswers(submissionData.answers);
          }
          // If submission has remaining time, use that instead
          if (submissionData.remainingTime) {
            setTimeRemaining(submissionData.remainingTime);
          }
        } catch (error) {
          console.error('Failed to load existing answers:', error);
          // Continue with fresh timer if can't load existing submission
          setTimeRemaining(testData.duration * 60);
        }
      } else if (assignmentId) {
        // Start new submission
        try {
          const response = await startSubmission(testId, assignmentId);
          setSubmissionId(response.submissionId);
          setTimeRemaining(testData.duration * 60);
        } catch (error) {
          console.error('Failed to start submission:', error);
          // Show error but don't redirect
          setLoading(false);
          return;
        }
      } else {
        // No assignment or submission ID - this shouldn't happen
        console.error('No assignment or submission ID provided');
        setTimeRemaining(testData.duration * 60);
      }

      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Failed to initialize test:', error);
      // Don't redirect immediately, let user see what happened
    } finally {
      setLoading(false);
    }
  };

  const startSubmission = async (testId: string, assignmentId: string) => {
    try {
      const response = await authService.startSubmission(testId, assignmentId);
      return response;
    } catch (error) {
      console.error('Failed to start submission:', error);
      // Try alternative approach
      try {
        const response = await authService.apiRequest(`/submissions/start/${testId}`, {
          method: 'POST',
          body: JSON.stringify({ assignmentId })
        });
        return response;
      } catch (fallbackError) {
        console.error('Fallback start submission also failed:', fallbackError);
        throw fallbackError;
      }
    }
  };

  const startSubmissionFallback = async (testId: string, assignmentId: string) => {
    try {
      const response = await authService.apiRequest(`/submissions/start/${testId}`, {
        method: 'POST',
        body: JSON.stringify({ assignmentId })
      });
      return response;
    } catch (error) {
      console.error('Failed to start submission:', error);
      throw error;
    }
  };

  const saveAnswer = useCallback(async (questionId: string, answer: string) => {
    if (!submissionId) return;

    setSaving(true);
    try {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

      await authService.apiRequest(`/submissions/answer/${submissionId}`, {
        method: 'POST',
        body: JSON.stringify({ questionId, answer, timeSpent })
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    } finally {
      setSaving(false);
    }
  }, [submissionId, questionStartTime]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    saveAnswer(questionId, answer);
  };

  // For typing questions: update local only; commit onBlur
  const handleAnswerChangeLocal = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleAnswerCommit = (questionId: string) => {
    const value = answers[questionId] || '';
    saveAnswer(questionId, value);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < allQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      updateCurrentPassage(currentQuestionIndex + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      updateCurrentPassage(currentQuestionIndex - 1);
      setQuestionStartTime(Date.now());
    }
  };

  const updateCurrentPassage = (questionIndex: number) => {
    const question = allQuestions[questionIndex];
    if (question?.passageId && test?.passages) {
      const passage = test.passages.find(p => p._id === question.passageId);
      setCurrentPassage(passage || null);
    } else {
      setCurrentPassage(null);
    }
  };

  const handleSubmitTest = async () => {
    if (!submissionId) return;

    try {
      await authService.apiRequest(`/submissions/submit/${submissionId}`, {
        method: 'POST'
      });

      router.push(`/submissions/results/${submissionId}`);
    } catch (error) {
      console.error('Failed to submit test:', error);
      // For demo, navigate anyway
      router.push(`/submissions/results/${submissionId}`);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'listening': return <Volume2 className="h-4 w-4" />;
      case 'writing': return <PenTool className="h-4 w-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="space-y-4">
            <div className="text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Unable to Load Test</h2>
            </div>
            <p className="text-muted-foreground">
              There was an error loading the test. This could be due to:
            </p>
            <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-1">
              <li>• Network connection issues</li>
              <li>• Test not found or unavailable</li>
              <li>• Server temporarily unavailable</li>
            </ul>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => router.push('/submissions')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tests
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentQuestionIndex];
  const getAnswerKey = (q?: Question, index?: number) => {
    if (!q) return '';
    const uniquePart = typeof q.number === 'number' ? q.number : ((index ?? currentQuestionIndex) + 1);
    return `${q._id}:${uniquePart}`;
  };
  const currentAnswerKey = getAnswerKey(currentQuestion, currentQuestionIndex);
  // UI answer helpers: keep UI keyed uniquely, but save by real questionId
  const handleSelectAnswer = (question: Question, index: number, value: string) => {
    const key = getAnswerKey(question, index);
    setAnswers(prev => ({ ...prev, [key]: value }));
    saveAnswer(question._id, value);
  };

  const handleLocalInputChange = (question: Question, index: number, value: string) => {
    const key = getAnswerKey(question, index);
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const handleLocalInputCommit = (question: Question, index: number) => {
    const key = getAnswerKey(question, index);
    const value = answers[key] || '';
    saveAnswer(question._id, value);
  };
  const progress = allQuestions.length > 0 ? ((currentQuestionIndex + 1) / allQuestions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md overflow-hidden flex-shrink-0">
                <img
                  src="/BHV-logo-page.jpg"
                  alt="BHV English Logo"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.src = '/logo.svg';
                  }}
                />
              </div>
              <div className="border-l border-slate-300 pl-3 hidden sm:block">
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${test.type === 'reading' ? 'bg-blue-100 text-blue-600' :
                      test.type === 'listening' ? 'bg-purple-100 text-purple-600' :
                        test.type === 'writing' ? 'bg-green-100 text-green-600' :
                          'bg-slate-100 text-slate-600'
                    }`}>
                    {getTypeIcon(test.type)}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 leading-tight">{test.title}</h2>
                    <p className="text-[10px] text-slate-500 leading-tight">{test.description}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/submissions')}
                className="gap-2 hover:bg-slate-100 text-slate-700"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${timeRemaining < 300
                  ? 'border-2 border-red-300'
                  : ''
                }`}>
                <Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-[#004875]'
                  }`} />
                <div className="text-right">
                  <div className={`font-mono text-base sm:text-lg font-bold leading-tight ${timeRemaining < 300 ? 'text-red-600' : 'text-[#004875]'
                    }`}>
                    {formatTime(timeRemaining)}
                  </div>
                  {timeRemaining < 300 && (
                    <div className="text-[10px] text-red-600 flex items-center justify-end gap-1 leading-tight">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      <span className="hidden sm:inline">Hurry up!</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Progress */}
        <Card className="mb-6 border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">
                  Question {currentQuestionIndex + 1}
                </span>
                <span className="text-sm text-slate-500">
                  of {allQuestions.length}
                </span>
              </div>
              <Badge variant="secondary" className="bg-[#004875] text-white hover:bg-[#003a5c]">
                {answeredCount}/{allQuestions.length} Answered
              </Badge>
            </div>
            <Progress value={progress} className="h-2.5" />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-4 lg:h-[calc(100vh-12rem)]">
          {/* Question Content - Scrollable Area */}
          <div className="lg:col-span-3 lg:overflow-y-auto lg:pr-2 space-y-6 lg:h-full lg:scrollbar-thin">
            {/* Passage Card */}
            {currentPassage && (
              <Card className="mb-6 border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${currentPassage.type === 'reading' ? 'bg-blue-100' :
                        currentPassage.type === 'listening' ? 'bg-purple-100' : 'bg-slate-100'
                      }`}>
                      {getTypeIcon(currentPassage.type)}
                    </div>
                    <span className="text-slate-900">{currentPassage.title}</span>
                    <Badge variant="secondary" className="capitalize bg-[#004875] text-white">
                      {currentPassage.type}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ScrollArea className="max-h-[60vh] lg:max-h-[500px] pr-4">
                    <div className="space-y-4">
                      {/* Audio for listening passages */}
                      {currentPassage.audioUrl && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            Passage Audio
                          </Label>
                          <AudioPlayer 
                            src={currentPassage.audioUrl}
                            title={currentPassage.title || 'Passage Audio'}
                            showDownload={false}
                            className="border-2 border-green-200"
                          />
                          <div className="text-xs text-muted-foreground p-2 bg-green-50 rounded">
                            🎧 Listen to the passage carefully before answering the questions.
                          </div>
                        </div>
                      )}

                      {/* Passage content */}
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-slate-700">Passage</Label>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-900">
                          {currentPassage.content}
                        </p>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Question Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Badge variant="outline" className="border-[#004875] text-[#004875] font-semibold px-3">
                      Q{currentQuestion?.number || (currentQuestionIndex + 1)}
                    </Badge>
                    <Badge variant="secondary" className="capitalize bg-slate-200 text-slate-700 font-medium">
                      {(currentQuestion?.subType || currentQuestion?.type).replace('-', ' ')}
                    </Badge>
                    <span className="text-sm text-slate-600 font-normal">
                      {currentQuestion?.points || 1} point{(currentQuestion?.points || 1) > 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    
                    {saving && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Save className="h-4 w-4 animate-pulse text-[#004875]" />
                        Saving...
                      </div>
                    )}
                  </div>
                </div>
                {currentQuestion?.sectionInstructions && (
                  <CardDescription className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {currentQuestion.sectionInstructions}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-6">

                    {/* Question */}
                    <div className="space-y-4">
                      {/* Audio Player for Listening Questions */}
                      {currentQuestion?.type === 'listening' && currentQuestion?.audioFile?.url && (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Volume2 className="h-5 w-5 text-purple-600" />
                            <Label className="text-sm font-semibold text-slate-700">
                              Listen to the audio
                            </Label>
                            {currentQuestion?.section && (
                              <Badge variant="outline" className="ml-2 border-purple-300 text-purple-700">
                                Section {currentQuestion.section}
                              </Badge>
                            )}
                          </div>
                          <AudioPlayer
                            src={currentQuestion.audioFile.url}
                            title={currentQuestion.audioFile.originalName || `Question ${currentQuestionIndex + 1} Audio`}
                            showDownload={false}
                            className="w-full"
                          />
                        </div>
                      )}

                      {/* Image for Questions with imageFile */}
                      {currentQuestion?.imageFile?.url && (
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Label className="text-sm font-semibold text-slate-700">
                              Reference Image
                            </Label>
                          </div>
                          <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                            <img
                              src={currentQuestion.imageFile.url}
                              alt={currentQuestion.imageFile.originalName || 'Question image'}
                              className="w-full h-auto max-h-96 object-contain"
                            />
                          </div>
                        </div>
                      )}

                      <div className="pb-2 border-b border-slate-200">
                        <Label className="text-base font-semibold text-slate-900 leading-relaxed">
                          {currentQuestion?.question || currentQuestion?.prompt}
                        </Label>
                        {currentQuestion?.instructionText && (
                          <p className="text-sm text-slate-600 mt-2 italic">
                            {currentQuestion.instructionText}
                          </p>
                        )}
                        {currentQuestion?.wordLimit && (
                          <Badge variant="outline" className="mt-2 border-blue-300 text-blue-700">
                            Word limit: {currentQuestion.wordLimit} words
                          </Badge>
                        )}
                      </div>

                      {/* Audio Player for Individual Question */}
                      {currentQuestion?.audioUrl && currentQuestion?.type === 'listening' && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            Question Audio
                          </Label>
                          <AudioPlayer 
                            src={currentQuestion.audioUrl}
                            title={`Question ${currentQuestion.number || (currentQuestionIndex + 1)} Audio`}
                            showDownload={false}
                            className="border-2 border-blue-200"
                          />
                          <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
                            🎧 Listen to this specific question audio before answering.
                          </div>
                        </div>
                      )}

                      {currentQuestion?.paragraphRef && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <Badge variant="outline" className="border-blue-400 text-blue-700 font-semibold">
                            Paragraph {currentQuestion.paragraphRef}
                          </Badge>
                          <span className="text-sm text-blue-700">
                            Refer to paragraph {currentQuestion.paragraphRef} in the passage above.
                          </span>
                        </div>
                      )}

                      {/* True/False/Not Given & Yes/No/Not Given */}
                      {(currentQuestion?.subType === 'true-false-not-given' || currentQuestion?.subType === 'yes-no-not-given') && (
                        <RadioGroup
                          value={answers[currentAnswerKey] || ''}
                          onValueChange={(value) => handleSelectAnswer(currentQuestion, currentQuestionIndex, value)}
                          className="space-y-2 pt-2"
                        >
                          {currentQuestion?.subType === 'true-false-not-given' ? (
                            <>
                              <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="True" id={`tf-${currentQuestionIndex}-true`} />
                                <Label htmlFor={`tf-${currentQuestionIndex}-true`} className="cursor-pointer font-medium flex-1">True</Label>
                              </div>
                              <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="False" id={`tf-${currentQuestionIndex}-false`} />
                                <Label htmlFor={`tf-${currentQuestionIndex}-false`} className="cursor-pointer font-medium flex-1">False</Label>
                              </div>
                              <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="Not Given" id={`tf-${currentQuestionIndex}-not-given`} />
                                <Label htmlFor={`tf-${currentQuestionIndex}-not-given`} className="cursor-pointer font-medium flex-1">Not Given</Label>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="yes" id={`yn-${currentQuestionIndex}-yes`} />
                                <Label htmlFor={`yn-${currentQuestionIndex}-yes`} className="cursor-pointer font-medium flex-1">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="no" id={`yn-${currentQuestionIndex}-no`} />
                                <Label htmlFor={`yn-${currentQuestionIndex}-no`} className="cursor-pointer font-medium flex-1">No</Label>
                              </div>
                              <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="not given" id={`yn-${currentQuestionIndex}-notgiven`} />
                                <Label htmlFor={`yn-${currentQuestionIndex}-notgiven`} className="cursor-pointer font-medium flex-1">Not Given</Label>
                              </div>
                            </>
                          )}
                        </RadioGroup>
                      )}

                      {/* Multiple Choice (Reading and Listening) */}
                      {(currentQuestion?.subType === 'multiple-choice' || currentQuestion?.subType === 'listening-multiple-choice') && currentQuestion?.options && (
                        <RadioGroup
                          value={answers[currentAnswerKey] || ''}
                          onValueChange={(value) => handleSelectAnswer(currentQuestion, currentQuestionIndex, value)}
                          className="space-y-2 pt-2"
                        >
                          {currentQuestion?.options?.map((option, index) => (
                            <div key={index} className="flex items-center space-x-3 py-2">
                              <RadioGroupItem value={option} id={`option-${currentQuestionIndex}-${index}`} />
                              <Label htmlFor={`option-${currentQuestionIndex}-${index}`} className="cursor-pointer font-medium flex-1 leading-relaxed">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {/* Matching Information */}
                      {currentQuestion?.subType === 'matching-information' && (
                        <div className="space-y-2">
                          <Label className="text-sm">Select the correct paragraph:</Label>
                          <RadioGroup
                            value={answers[currentAnswerKey] || ''}
                            onValueChange={(value) => handleSelectAnswer(currentQuestion, currentQuestionIndex, value)}
                          >
                            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter) => (
                              <div key={letter} className="flex items-center space-x-2">
                                <RadioGroupItem value={letter} id={`para-${currentQuestionIndex}-${letter}`} />
                                <Label htmlFor={`para-${currentQuestionIndex}-${letter}`} className="cursor-pointer">
                                  Paragraph {letter}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      )}

                      {/* Matching Headings */}
                      {currentQuestion?.subType === 'matching-headings' && (
                        <>
                          {currentQuestion?.options && currentQuestion.options.length > 0 ? (
                            <RadioGroup
                              value={answers[currentAnswerKey] || ''}
                              onValueChange={(value) => handleSelectAnswer(currentQuestion, currentQuestionIndex, value)}
                            >
                              {currentQuestion.options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`heading-${currentQuestionIndex}-${index}`} />
                                  <Label htmlFor={`heading-${currentQuestionIndex}-${index}`} className="cursor-pointer">
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          ) : (
                            <Input
                              placeholder="Enter heading label (e.g., I, II, III)"
                              value={answers[currentAnswerKey] || ''}
                              onChange={(e) => handleLocalInputChange(currentQuestion, currentQuestionIndex, e.target.value)}
                              onBlur={() => handleLocalInputCommit(currentQuestion, currentQuestionIndex)}
                            />
                          )}
                        </>
                      )}

                      {/* Sentence Completion / Summary Completion / Short Answer / Listening Completion Types */}
                      {(currentQuestion?.subType === 'sentence-completion' ||
                        currentQuestion?.subType === 'summary-completion' ||
                        currentQuestion?.subType === 'short-answer' ||
                        currentQuestion?.subType === 'fill-blank' ||
                        currentQuestion?.subType === 'diagram-completion' ||
                        currentQuestion?.subType === 'form-completion' ||
                        currentQuestion?.subType === 'note-completion' ||
                        currentQuestion?.subType === 'table-completion' ||
                        currentQuestion?.subType === 'flowchart-completion' ||
                        currentQuestion?.subType === 'diagram-labelling' ||
                        currentQuestion?.subType === 'map-labelling' ||
                        currentQuestion?.subType === 'plan-labelling' ||
                        currentQuestion?.subType === 'listening-short-answer' ||
                        currentQuestion?.subType === 'listening-matching' ||
                        currentQuestion?.subType === 'pick-from-list') && (
                          <Input
                            placeholder="Type your answer here..."
                            value={answers[currentAnswerKey] || ''}
                            onChange={(e) => handleLocalInputChange(currentQuestion, currentQuestionIndex, e.target.value)}
                            onBlur={() => handleLocalInputCommit(currentQuestion, currentQuestionIndex)}
                            className="border-slate-300 focus:border-[#004875] focus:ring-[#004875] text-base py-5"
                          />
                        )}

                      {/* Writing tasks */}
                      {(currentQuestion?.subType === 'task1' || currentQuestion?.subType === 'task2' || currentQuestion?.subType === 'essay') && (
                        <div className="space-y-3">
                          {currentQuestion?.wordLimit && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600">Word limit: {currentQuestion.wordLimit} words</span>
                              <span className="text-slate-500">
                                Current: {(answers[currentAnswerKey] || '').split(/\s+/).filter(Boolean).length} words
                              </span>
                            </div>
                          )}
                          <Textarea
                            placeholder="Write your response here..."
                            rows={12}
                            value={answers[currentAnswerKey] || ''}
                            onChange={(e) => handleSelectAnswer(currentQuestion, currentQuestionIndex, e.target.value)}
                            className="border-slate-300 focus:border-[#004875] focus:ring-[#004875] text-base leading-relaxed resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>

              {/* Navigation - Moved here for better UX */}
              <CardContent className="border-t border-slate-100 bg-slate-50/30 py-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="flex-1 border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === allQuestions.length - 1}
                    className="flex-1 border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Overview Sidebar - Fixed Position on Desktop */}
          <div className="lg:col-span-1 lg:h-full lg:overflow-hidden flex flex-col gap-4">
            {/* Questions Grid */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3">
                <CardTitle className="text-slate-900 text-base">Questions</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 pb-4">
                <ScrollArea className="h-[280px] lg:h-[320px] pr-3">
                  <div className="grid grid-cols-5 gap-1.5">
                    {allQuestions?.map((question, index) => {
                      const isAnswered = !!answers[getAnswerKey(question, index)];
                      const isCurrent = currentQuestionIndex === index;

                      return (
                        <Button
                          key={index}
                          variant={isCurrent ? "default" : "outline"}
                          size="sm"
                          className={`h-8 w-8 p-0 text-xs font-semibold transition-all ${isCurrent
                              ? 'bg-[#004875] hover:bg-[#003a5c] text-white border-[#004875] shadow-md'
                              : isAnswered
                                ? 'bg-green-50 border-green-400 text-green-700 hover:bg-green-100'
                                : 'border-slate-300 hover:bg-slate-100 hover:border-slate-400'
                            }`}
                          onClick={() => {
                            setCurrentQuestionIndex(index);
                            updateCurrentPassage(index);
                            setQuestionStartTime(Date.now());
                          }}
                        >
                          {index + 1}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                    <div className="w-3 h-3 bg-[#004875] rounded shadow-sm"></div>
                    <span className="font-medium">Current</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                    <div className="w-3 h-3 bg-green-50 border-2 border-green-400 rounded"></div>
                    <span className="font-medium">Answered</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
                    <div className="w-3 h-3 bg-white border-2 border-slate-300 rounded"></div>
                    <span className="font-medium">Unanswered</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button - Prominent Position */}
            <Card className="border-slate-200 shadow-lg">
              <CardContent className="p-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      className="w-full bg-gradient-to-r from-[#004875] to-[#003a5c] hover:from-[#003a5c] hover:to-[#002a3c] text-white shadow-md font-semibold py-6 text-base"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Submit Test
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-slate-200">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-slate-900">Submit Test</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-600">
                        Are you sure you want to submit your test? You have answered {answeredCount} out of {allQuestions.length} questions.
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="border-slate-300">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmitTest} className="bg-[#004875] hover:bg-[#003a5c]">
                        Submit Test
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}