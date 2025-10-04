'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  AlertTriangle
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { AudioPlayer } from '@/components/ui/audio-player';

interface Question {
  _id: string;
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  question: string;
  passage?: string;
  audioUrl?: string;
  options?: string[];
  points: number;
  answer?: string;
  timeSpent?: number;
}

interface Test {
  _id: string;
  title: string;
  description: string;
  type: 'reading' | 'listening' | 'writing' | 'mixed';
  duration: number;
  questions: Question[];
  passages?: any[];
}

export default function TakeTestPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [test, setTest] = useState<Test | null>(null);
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
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const initializeTest = async (testId: string) => {
    try {
      // Mock test data - replace with actual API call
      const mockTest: Test = {
        _id: testId,
        title: 'IELTS Reading Practice Test 1',
        description: 'Academic reading test with 3 passages',
        type: 'reading',
        duration: 60,
        questions: [
          {
            _id: 'q1',
            type: 'reading',
            subType: 'multiple-choice',
            question: 'What is the main topic of the passage?',
            passage: 'The Industrial Revolution, which took place from the 18th to 19th centuries, was a period during which predominantly agrarian, rural societies in Europe and America became industrial and urban...',
            options: [
              'The history of agriculture',
              'The Industrial Revolution',
              'Urban development',
              'European society'
            ],
            points: 1
          },
          {
            _id: 'q2',
            type: 'reading',
            subType: 'fill-blank',
            question: 'The Industrial Revolution took place from the _____ to _____ centuries.',
            passage: 'The Industrial Revolution, which took place from the 18th to 19th centuries, was a period during which predominantly agrarian, rural societies in Europe and America became industrial and urban...',
            points: 2
          },
          {
            _id: 'q3',
            type: 'reading',
            subType: 'true-false',
            question: 'The Industrial Revolution only affected European societies.',
            passage: 'The Industrial Revolution, which took place from the 18th to 19th centuries, was a period during which predominantly agrarian, rural societies in Europe and America became industrial and urban...',
            options: ['True', 'False', 'Not Given'],
            points: 1
          }
        ]
      };

      setTest(mockTest);
      setTimeRemaining(mockTest.duration * 60); // Convert to seconds

      // Start or continue submission
      if (existingSubmissionId) {
        setSubmissionId(existingSubmissionId);
        // Load existing answers
      } else if (assignmentId) {
        // Start new submission
        const response = await startSubmission(testId, assignmentId);
        setSubmissionId(response.submissionId);
      }

      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Failed to initialize test:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSubmission = async (testId: string, assignmentId: string) => {
    // Mock API call - replace with actual implementation
    return { submissionId: 'mock-submission-id' };
  };

  const saveAnswer = useCallback(async (questionId: string, answer: string) => {
    if (!submissionId) return;

    setSaving(true);
    try {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

      // Mock API call - replace with actual implementation
      // await authService.apiRequest(`/submissions/answer/${submissionId}`, {
      //   method: 'POST',
      //   body: JSON.stringify({ questionId, answer, timeSpent })
      // });

      console.log('Saving answer:', { questionId, answer, timeSpent });
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

  const handleSubmitTest = async () => {
    if (!submissionId) return;

    try {
      // Mock API call - replace with actual implementation
      // await authService.apiRequest(`/submissions/submit/${submissionId}`, {
      //   method: 'POST'
      // });

      router.push(`/dashboard/submissions/results/${submissionId}`);
    } catch (error) {
      console.error('Failed to submit test:', error);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading test...</p>
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
  const answeredCount = Object.keys(answers).length;

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
                  <Badge variant="outline">{currentQuestion?.subType.replace('-', ' ')}</Badge>
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
                  {/* Passage */}
                  {currentQuestion?.passage && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Passage</Label>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {currentQuestion?.passage}
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
                        💡 Listen carefully. You can replay the audio multiple times.
                      </div>
                    </div>
                  )}

                  {/* Question */}
                  <div className="space-y-4">
                    <Label className="text-base font-medium">{currentQuestion?.question}</Label>

                    {/* Multiple Choice */}
                    {currentQuestion?.options && currentQuestion?.subType === 'multiple-choice' && (
                      <RadioGroup
                        value={answers[currentQuestion?._id] || ''}
                        onValueChange={(value) => handleAnswerChange(currentQuestion?._id, value)}
                      >
                        {currentQuestion?.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`option-${currentQuestionIndex}-${index}`} />
                            <Label htmlFor={`option-${currentQuestionIndex}-${index}`} className="cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {/* True/False/Not Given */}
                    {currentQuestion?.options && currentQuestion?.subType === 'true-false' && (
                      <RadioGroup
                        value={answers[currentQuestion?._id] || ''}
                        onValueChange={(value) => handleAnswerChange(currentQuestion?._id, value)}
                      >
                        {currentQuestion?.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`tf-${currentQuestionIndex}-${index}`} />
                            <Label htmlFor={`tf-${currentQuestionIndex}-${index}`} className="cursor-pointer">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    )}

                    {/* Fill in the blank / Short answer */}
                    {(currentQuestion?.subType === 'fill-blank' || currentQuestion?.subType === 'short-answer') && (
                      <Input
                        placeholder="Enter your answer..."
                        value={answers[currentQuestion?._id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion?._id, e.target.value)}
                      />
                    )}

                    {/* Writing tasks */}
                    {(currentQuestion?.subType === 'task1' || currentQuestion?.subType === 'task2') && (
                      <Textarea
                        placeholder="Write your response here..."
                        rows={10}
                        value={answers[currentQuestion?._id] || ''}
                        onChange={(e) => handleAnswerChange(currentQuestion?._id, e.target.value)}
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
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === test.questions.length - 1}
                  className="flex-1"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" variant="default">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Test
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Submit Test</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to submit your test? You have answered {answeredCount} out of {test.questions.length} questions.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmitTest}>
                      Submit Test
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          {/* Question Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Question Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="grid grid-cols-5 gap-2">
                  {test.questions.map((_, index) => (
                    <Button
                      key={index}
                      variant={currentQuestionIndex === index ? "default" : "outline"}
                      size="sm"
                      className={`h-8 w-8 p-0 ${answers[test.questions[index]._id]
                        ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
                        : ''
                        }`}
                      onClick={() => {
                        setCurrentQuestionIndex(index);
                        setQuestionStartTime(Date.now());
                      }}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white border border-gray-300 rounded"></div>
                  <span>Not answered</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}