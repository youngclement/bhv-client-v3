'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  ImageIcon
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { AudioPlayer } from '@/components/ui/audio-player';
import { useToast } from '@/hooks/use-toast';

interface Question {
  _id: string;
  testId: string;
  questionNumber?: number;
  // Backend schema: reading, listening, writing, speaking, full
  type: 'reading' | 'listening' | 'writing' | 'speaking' | 'full';
  subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite' | 'task1' | 'task2';
  question: string;
  instructionText?: string;
  explanation?: string;
  passage?: string; // Legacy support
  audioUrl?: string; // Legacy support
  // Audio file for listening questions
  audioFile?: {
    url: string;
    publicId?: string;
    originalName?: string;
    format?: string;
    bytes?: number;
    duration?: number;
  };
  // Image file for diagram, chart questions
  imageFile?: {
    url: string;
    publicId?: string;
    originalName?: string;
    format?: string;
    bytes?: number;
    width?: number;
    height?: number;
  };
  options: string[];
  correctAnswer?: any;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  wordLimit?: number;
  blanksCount?: number;
  section?: 1 | 2 | 3 | 4;
  isComposite: boolean;
  hasSubQuestions: boolean;
  allowSubQuestions: boolean;
  // Audio timestamp for sync
  audioTimestamp?: {
    start: number;
    end: number;
  };
  // Sub-questions support
  subQuestions: Array<{
    _id?: string;
    subQuestionNumber: number;
    subQuestionType?: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer' | 'text' | 'matching';
    question: string;
    options?: string[];
    correctAnswer?: any;
    points: number;
    explanation?: string;
    audioTimestamp?: {
      start: number;
      end: number;
    };
    // Student's answer (frontend only)
    answer?: string;
  }>;
  // Student's answer tracking (frontend only)
  answer?: string;
  timeSpent?: number;
}

interface Test {
  _id: string;
  title: string;
  description: string;
  type: 'reading' | 'listening' | 'writing' | 'speaking' | 'full';
  passages: any[];
  questions: Question[];
  duration: number;
  totalPoints: number;
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TakeTestPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [test, setTest] = useState<Test | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const assignmentId = searchParams.get('assignment')?.trim() || null;
  const existingSubmissionId = searchParams.get('submission')?.trim() || null;

  const handleSubmitTest = useCallback(async () => {
    if (!submissionId) {
      toast({
        title: 'Submission not ready',
        description: 'Unable to submit because no active submission was found. Please refresh or reopen the test from your assignments.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await authService.submitTest(submissionId);
      router.push(`/dashboard/submissions/results/${submissionId}`);
    } catch (error) {
      console.error('Failed to submit test:', error);
      toast({
        title: 'Failed to submit test',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  }, [submissionId, router, toast]);

  const initializeTest = useCallback(async (testId: string) => {
    try {
      setSubmissionError(null);
      setSubmissionId(null);
      setAnswers({});

      const testData = await authService.apiRequest(`/tests/${testId}`);
      setTest(testData);

      const durationInMinutes = Number(testData?.duration);
      if (Number.isFinite(durationInMinutes) && durationInMinutes > 0) {
        setTimeRemaining(Math.floor(durationInMinutes * 60));
      } else {
        setTimeRemaining(0);
      }

      if (existingSubmissionId) {
        setSubmissionId(existingSubmissionId);
        return;
      }

      if (assignmentId) {
        const submission = await authService.startSubmission(testId, assignmentId);
        if (submission?._id) {
          setSubmissionId(submission._id);
          return;
        }
        throw new Error('Submission identifier missing in response.');
      }

      setSubmissionError('Missing assignment or submission information. Please open this test from your assignments list.');
    } catch (error) {
      console.error('Failed to initialize test:', error);
      const fallbackMessage = 'Failed to initialize the test. Please refresh the page or contact support.';
      if (error instanceof Error && error.message && !error.message.includes('API request failed')) {
        setSubmissionError(error.message);
      } else {
        setSubmissionError(fallbackMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [assignmentId, existingSubmissionId]);

  useEffect(() => {
    if (params.testId) {
      initializeTest(params.testId as string);
    }
  }, [params.testId, initializeTest]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining, handleSubmitTest]);

  const hasMeaningfulAnswer = useCallback((question: Question | undefined, answerValue?: string) => {
    if (!answerValue) {
      return false;
    }

    if (question?.subType === 'fill-blank') {
      try {
        const parsed = JSON.parse(answerValue);
        if (Array.isArray(parsed)) {
          return parsed.some((item) => typeof item === 'string' && item.trim().length > 0);
        }
      } catch {
        return answerValue.trim().length > 0;
      }
      return false;
    }

    return answerValue.trim().length > 0;
  }, []);

  const handleAnswerChange = useCallback(async (questionId: string, answer: string) => {
    const targetQuestion = test?.questions.find((question) => question._id === questionId);
    const isFilled = hasMeaningfulAnswer(targetQuestion, answer);
    const payloadAnswer = isFilled
      ? answer
      : targetQuestion?.subType === 'fill-blank'
        ? '[]'
        : '';

    setAnswers(prev => {
      const updated = { ...prev };
      if (isFilled) {
        updated[questionId] = payloadAnswer;
      } else {
        delete updated[questionId];
      }
      return updated;
    });
    
    if (submissionId) {
      setSaving(true);
      try {
        const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
        await authService.saveAnswer(submissionId, questionId, payloadAnswer);
      } catch (error) {
        console.error('Failed to save answer:', error);
      } finally {
        setSaving(false);
      }
    }
  }, [submissionId, questionStartTime, test, hasMeaningfulAnswer]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < (test?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setQuestionStartTime(Date.now());
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  if (submissionError) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-muted-foreground">{submissionError}</p>
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" onClick={() => router.refresh()}>
            Retry
          </Button>
          <Button onClick={() => router.push('/dashboard/submissions')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Test not found</p>
        <Button onClick={() => router.push('/dashboard/submissions')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;
  const answeredCount = useMemo(() => {
    if (!test) return 0;
    return test.questions.reduce((count, question) => {
      return hasMeaningfulAnswer(question, answers[question._id]) ? count + 1 : count;
    }, 0);
  }, [test, answers, hasMeaningfulAnswer]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getTypeIcon(test.type)}
            <div>
              <h2 className="text-2xl font-bold">{test.title}</h2>
              <p className="text-muted-foreground">{test.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className={`font-mono text-lg ${timeRemaining < 300 ? 'text-red-600' : ''}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            {timeRemaining < 300 && (
              <div className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Time running out!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {test.questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {answeredCount} answered
            </span>
          </div>
          <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Question Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="outline" className={getDifficultyColor(currentQuestion?.difficulty || 'medium')}>
                    {currentQuestion?.difficulty}
                  </Badge>
                  <Badge variant="secondary">{currentQuestion?.subType.replace('-', ' ')}</Badge>
                  <span>{currentQuestion?.points} point{currentQuestion?.points > 1 ? 's' : ''}</span>
                </CardTitle>
                {saving && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Save className="h-4 w-4 animate-pulse" />
                    Saving...
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6">
                  
                  {/* Detailed Instructions for Writing */}
                  {currentQuestion?.instructionText && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Instructions</Label>
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {currentQuestion.instructionText}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Image for Reading/Writing Task 1 */}
                  {currentQuestion?.imageFile && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        {currentQuestion.type === 'writing' ? 'Chart/Graph to Analyze' : 'Reference Image'}
                      </Label>
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <Image
                          src={currentQuestion.imageFile.url}
                          alt={currentQuestion.imageFile.originalName || 'Image'}
                          width={currentQuestion.imageFile.width || 400}
                          height={currentQuestion.imageFile.height || 300}
                          className="w-full h-auto max-h-96 object-contain"
                        />
                        <div className="p-2 text-xs text-muted-foreground bg-gray-50">
                          {currentQuestion.imageFile.originalName} - {currentQuestion.imageFile.width || 0}x{currentQuestion.imageFile.height || 0} - {Math.round((currentQuestion.imageFile.bytes || 0) / 1024)} KB
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audio for Listening Questions */}
                  {(currentQuestion?.audioFile || currentQuestion?.audioUrl) && currentQuestion?.type === 'listening' && (
                    <div className="space-y-2">
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
                        src={currentQuestion.audioFile?.url || currentQuestion.audioUrl || ''}
                        title={currentQuestion.audioFile?.originalName || `Question ${currentQuestionIndex + 1} Audio`}
                        showDownload={false}
                        className="w-full"
                      />
                      <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                        Note: You can replay the audio multiple times. Listen carefully before answering.
                      </div>
                    </div>
                  )}

                  {/* Passage for Reading */}
                  {currentQuestion?.passage && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Reading Passage</Label>
                      <div className="p-4 bg-muted rounded-lg border">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {currentQuestion.passage}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Audio Player for Listening Questions */}
                  {currentQuestion?.audioUrl && currentQuestion?.type === 'listening' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Listening Audio
                      </Label>
                      <AudioPlayer 
                        src={currentQuestion.audioUrl}
                        title={`Question ${currentQuestionIndex + 1} Audio`}
                        showDownload={false}
                        className="border-2 border-blue-200"
                      />
                      <div className="text-xs text-muted-foreground p-2 bg-blue-50 rounded">
                        Note: Listen carefully. You can replay the audio multiple times.
                      </div>
                    </div>
                  )}

                  {/* Answer Section */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Your Answer</Label>
                    
                    {/* Multiple Choice */}
                    {currentQuestion?.options && currentQuestion?.subType.includes('multiple-choice') && (
                      <RadioGroup 
                        value={answers[currentQuestion._id] || ''} 
                        onValueChange={(value) => handleAnswerChange(currentQuestion._id, value)}
                      >
                        <div className="space-y-3">
                          {currentQuestion.options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                              <RadioGroupItem value={option} id={`option-${index}`} />
                              <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                                <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}

                    {/* True/False/Not Given */}
                    {currentQuestion?.subType.includes('true-false') && (
                      <RadioGroup 
                        value={answers[currentQuestion._id] || ''} 
                        onValueChange={(value) => handleAnswerChange(currentQuestion._id, value)}
                      >
                        <div className="space-y-3">
                          {['True', 'False', 'Not Given'].map((option) => (
                            <div key={option} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                              <RadioGroupItem value={option} id={option} />
                              <Label htmlFor={option} className="flex-1 cursor-pointer font-medium">
                                {option}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}

                    {/* Fill in the Blank */}
                    {currentQuestion?.subType === 'fill-blank' && (
                      <div className="space-y-3">
                        {Array.from({ length: currentQuestion.blanksCount || 1 }).map((_, index) => (
                          <div key={index} className="space-y-1">
                            <Label htmlFor={`blank-${index}`} className="text-sm">
                              Blank {index + 1}
                            </Label>
                            <Input
                              id={`blank-${index}`}
                              placeholder={`Enter answer for blank ${index + 1}...`}
                              value={(() => {
                                try {
                                  const parsedAnswers = JSON.parse(answers[currentQuestion._id] || '[]');
                                  return parsedAnswers[index] || '';
                                } catch {
                                  return '';
                                }
                              })()}
                              onChange={(e) => {
                                try {
                                  const parsedAnswers = JSON.parse(answers[currentQuestion._id] || '[]');
                                  while (parsedAnswers.length <= index) parsedAnswers.push('');
                                  parsedAnswers[index] = e.target.value;
                                  handleAnswerChange(currentQuestion._id, JSON.stringify(parsedAnswers));
                                } catch {
                                  const newAnswers = Array(currentQuestion.blanksCount || 1).fill('');
                                  newAnswers[index] = e.target.value;
                                  handleAnswerChange(currentQuestion._id, JSON.stringify(newAnswers));
                                }
                              }}
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Short Answer */}
                    {currentQuestion?.subType === 'short-answer' && (
                      <Input
                        placeholder="Enter your short answer..."
                        value={answers[currentQuestion._id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                        className="w-full"
                      />
                    )}

                    {/* Writing Tasks (Essay, Task1, Task2) */}
                    {currentQuestion?.type === 'writing' && ['essay', 'task1', 'task2'].includes(currentQuestion.subType) && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder={
                            currentQuestion.subType === 'task1' 
                              ? "Describe the chart/graph/diagram in detail. Identify key trends, comparisons, and notable features..."
                              : currentQuestion.subType === 'task2'
                              ? "Present your argument with clear introduction, body paragraphs with examples, and conclusion..."
                              : "Write your essay here..."
                          }
                          value={answers[currentQuestion._id] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                          rows={12}
                          className="w-full resize-none"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Word count: {answers[currentQuestion._id] ? answers[currentQuestion._id].split(/\s+/).filter(word => word.length > 0).length : 0} words</span>
                          {currentQuestion.wordLimit && (
                            <span className={answers[currentQuestion._id] && answers[currentQuestion._id].split(/\s+/).filter(word => word.length > 0).length > currentQuestion.wordLimit ? 'text-red-600' : ''}>
                              Target: {currentQuestion.wordLimit} words
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Matching */}
                    {currentQuestion?.subType === 'matching' && (
                      <Textarea
                        placeholder="Enter your matching answers (e.g., 1-A, 2-B, 3-C)..."
                        value={answers[currentQuestion._id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                        rows={4}
                        className="w-full"
                      />
                    )}

                    {/* Default Text Area for other types */}
                    {(!currentQuestion?.options && 
                     !currentQuestion?.subType.includes('true-false') && 
                     !currentQuestion?.subType.includes('multiple-choice') && 
                     !['fill-blank', 'short-answer', 'essay', 'task1', 'task2', 'matching'].includes(currentQuestion?.subType || '')) && (
                      <Textarea
                        placeholder="Enter your answer..."
                        value={answers[currentQuestion?._id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion?._id, e.target.value)}
                        rows={4}
                        className="w-full"
                      />
                    )}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Navigation & Summary */}
        <div className="space-y-6">
          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === test.questions.length - 1}
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Submit Test */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" variant="default" disabled={!submissionId}>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Test
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Submit Test?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to submit your test? You won&apos;t be able to make changes after submission.
                      <br /><br />
                      Answered: {answeredCount} / {test.questions.length} questions
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Continue Test</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmitTest}>
                      Submit Test
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Question Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Question Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-1">
                {test.questions.map((_, index) => (
                  <Button
                    key={index}
                    variant={index === currentQuestionIndex ? "default" : answers[test.questions[index]._id] ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCurrentQuestionIndex(index);
                      setQuestionStartTime(Date.now());
                    }}
                    className="aspect-square p-0 text-xs"
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded"></div>
                  Current
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-secondary rounded"></div>
                  Answered
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-border rounded"></div>
                  Unanswered
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
