'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
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
  Edit2,
  BookOpen,
  Volume2,
  PenTool,
  Play,
  Clock,
  FileText,
  Target,
  CheckCircle2,
  Image as ImageIcon,
  Users,
  Calendar
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { AudioPlayer } from '@/components/ui/audio-player';

interface Test {
  _id: string;
  title: string;
  description: string;
  type: 'reading' | 'listening' | 'writing' | 'full';
  duration: number;
  totalPoints: number;
  totalQuestionsActual: number;
  status: 'draft' | 'active' | 'archived';
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Question {
  _id: string;
  questionNumber: number;
  type: 'reading' | 'listening' | 'writing' | 'full';
  subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite' | 'true-false';
  question: string;
  instructionText?: string;
  passage?: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  section?: number;
  hasSubQuestions: boolean;
  audioFile?: {
    url: string;
    publicId?: string;
    originalName?: string;
    format?: string;
    duration?: number;
  };
  imageFile?: {
    url: string;
    publicId?: string;
    originalName?: string;
    format?: string;
    width?: number;
    height?: number;
  };
  subQuestions?: Array<{
    _id?: string;
    subQuestionNumber: number;
    subQuestionType: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer';
    question: string;
    options?: string[];
    correctAnswer?: string;
    points: number;
    explanation?: string;
  }>;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  updatedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Assignment {
  _id: string;
  testId: string;
  studentIds: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  }>;
  assignedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  dueDate: string;
  isActive: boolean;
  createdAt: string;
}

interface TestDetailResponse {
  message: string;
  test: Test;
  questions: Question[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage: number | null;
    prevPage: number | null;
  };
  assignments: {
    total: number;
    active: number;
    list: Assignment[];
  };
  statistics: {
    totalQuestions: number;
    totalAssignments: number;
    activeAssignments: number;
    bySection: Array<{
      _id: number;
      count: number;
      totalPoints: number;
    }>;
    byType: Array<{
      _id: string;
      count: number;
      totalPoints: number;
    }>;
    byDifficulty: Array<{
      _id: string;
      count: number;
      totalPoints: number;
    }>;
  };
}

const testTypes = [
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'listening', label: 'Listening', icon: Volume2 },
  { value: 'writing', label: 'Writing', icon: PenTool },
  { value: 'full', label: 'Full', icon: Play },
];

export default function TestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [testData, setTestData] = useState<TestDetailResponse | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTestDetail = useCallback(async () => {
    if (!testId) return;

    try {
      setLoading(true);
      setError('');
      const data = await authService.apiRequest(`/tests/${testId}/full-detail`);
      console.log('Test detail received:', data);
      setTestData(data);
    } catch (err: any) {
      console.error('Failed to fetch test detail:', err);
      setError(err.message || 'Failed to load test');
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    fetchTestDetail();
  }, [fetchTestDetail]);

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    if (testData && currentQuestionIndex < testData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleEditQuestion = (questionId: string) => {
    router.push(`/dashboard/tests/${testId}/question/${questionId}/edit`);
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = testTypes.find(t => t.value === type);
    return typeConfig ? <typeConfig.icon className="h-5 w-5" /> : null;
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Loading Test</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we load the test details...
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !testData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Failed to Load Test</h3>
                <p className="text-sm text-muted-foreground">
                  {error || 'Test not found'}
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard/tests')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tests
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { test, questions, statistics, assignments } = testData;
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b  z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/tests')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold">{test.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {getTypeIcon(test.type)}
                  <span className="capitalize">{test.type} Test</span>
                  <span>•</span>
                  <Clock className="h-3.5 w-3.5" />
                  <span>{test.duration} minutes</span>
                </div>
              </div>
            </div>

            <Badge variant={test.isActive ? "default" : "secondary"} className="text-sm">
              {test.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Test Info & Statistics */}
          <div className="lg:col-span-1 space-y-6">
            {/* Test Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Test Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{statistics.totalQuestions}</div>
                    <div className="text-xs text-muted-foreground">Questions</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{test.totalPoints}</div>
                    <div className="text-xs text-muted-foreground">Points</div>
                  </div>
                </div>

                {/* By Type */}
                {statistics.byType.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">By Type</Label>
                    <div className="space-y-1">
                      {statistics.byType.map((item) => (
                        <div key={item._id} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-xs">{item._id}</span>
                          <Badge variant="outline" className="text-xs">{item.count} ({item.totalPoints}pts)</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Difficulty */}
                {statistics.byDifficulty.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">By Difficulty</Label>
                    <div className="space-y-1">
                      {statistics.byDifficulty.map((item) => (
                        <div key={item._id} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-xs">{item._id}</span>
                          <Badge className={`text-xs ${getDifficultyColor(item._id)}`}>
                            {item.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Section */}
                {statistics.bySection.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">By Section</Label>
                    <div className="space-y-1">
                      {statistics.bySection.map((item) => (
                        <div key={item._id} className="flex items-center justify-between text-sm">
                          <span className="text-xs">Section {item._id}</span>
                          <Badge variant="outline" className="text-xs">{item.count} ({item.totalPoints}pts)</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignments */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assignments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold">{assignments.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xl font-bold text-green-700">{assignments.active}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                </div>

                {assignments.list.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-medium">Recent Assignments</Label>
                    <ScrollArea className="h-48">
                      <div className="space-y-2">
                        {assignments.list.slice(0, 5).map((assignment) => (
                          <div key={assignment._id} className="p-2 border rounded text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <Badge variant={assignment.isActive ? "default" : "secondary"} className="text-xs">
                                {assignment.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {assignment.studentIds.length} students
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Question Display */}
          <div className="lg:col-span-2">
            {questions.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="rounded-full bg-gray-100 p-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">No Questions Yet</h3>
                      <p className="text-sm text-muted-foreground">
                        This test doesn't have any questions yet.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Progress Bar */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <span className="text-muted-foreground">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Question Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">
                            Question #{currentQuestion.questionNumber}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {currentQuestion.type}
                          </Badge>
                          <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                            {currentQuestion.difficulty}
                          </Badge>
                          <Badge variant="secondary">
                            {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                          </Badge>
                          {currentQuestion.section && (
                            <Badge variant="outline">
                              Section {currentQuestion.section}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditQuestion(currentQuestion._id)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Instruction Text */}
                    {currentQuestion.instructionText && (
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                          Instructions
                        </Label>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {currentQuestion.instructionText}
                        </p>
                      </div>
                    )}

                    {/* Passage */}
                    {currentQuestion.passage && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-gray-700" />
                          <Label className="text-sm font-semibold text-gray-700">
                            Reading Passage
                          </Label>
                        </div>
                        <div className="p-4 bg-white rounded-lg border">
                          <div className="prose prose-sm max-w-none">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {currentQuestion.passage}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Audio Player */}
                    {currentQuestion.audioFile?.url && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-5 w-5 text-gray-700" />
                          <Label className="text-sm font-semibold text-gray-700">
                            Audio
                          </Label>
                        </div>
                        <AudioPlayer
                          src={currentQuestion.audioFile.url}
                          title={currentQuestion.audioFile.originalName || `Question ${currentQuestionIndex + 1} Audio`}
                          showDownload={false}
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Image */}
                    {currentQuestion.imageFile?.url && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-gray-700" />
                          <Label className="text-sm font-semibold text-gray-700">
                            Image
                          </Label>
                        </div>
                        <div className="rounded-lg border overflow-hidden">
                          <img
                            src={currentQuestion.imageFile.url}
                            alt={currentQuestion.imageFile.originalName || 'Question image'}
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        </div>
                      </div>
                    )}

                    {/* Question Text */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold text-gray-900">
                        Question
                      </Label>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {currentQuestion.question}
                      </p>
                    </div>

                    {/* Options for Multiple Choice */}
                    {currentQuestion.subType === 'multiple-choice' && currentQuestion.options && currentQuestion.options.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-700">
                          Options
                        </Label>
                        <RadioGroup value={currentQuestion.correctAnswer}>
                          <div className="space-y-2">
                            {currentQuestion.options.map((option, index) => (
                              <div
                                key={index}
                                className={`flex items-center space-x-3 p-3 rounded-lg border ${option === currentQuestion.correctAnswer
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-white'
                                  }`}
                              >
                                <RadioGroupItem value={option} id={`option-${index}`} disabled />
                                <Label
                                  htmlFor={`option-${index}`}
                                  className="flex-1 cursor-pointer text-sm"
                                >
                                  <span className="font-semibold mr-2">
                                    {String.fromCharCode(65 + index)}.
                                  </span>
                                  {option}
                                </Label>
                                {option === currentQuestion.correctAnswer && (
                                  <Badge variant="default" className="bg-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Correct
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      </div>
                    )}

                    {/* Sub Questions */}
                    {currentQuestion.hasSubQuestions && currentQuestion.subQuestions && currentQuestion.subQuestions.length > 0 && (
                      <div className="space-y-4 pt-4">
                        <Label className="text-base font-semibold text-gray-900">
                          Sub Questions ({currentQuestion.subQuestions.length})
                        </Label>
                        <div className="space-y-4">
                          {currentQuestion.subQuestions.map((subQ, subIndex) => (
                            <div key={subQ._id || subIndex} className="p-4 bg-white rounded-lg border">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      #{subQ.subQuestionNumber}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                      {subQ.points} {subQ.points === 1 ? 'point' : 'points'}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {subQ.subQuestionType}
                                    </Badge>
                                  </div>
                                </div>

                                <p className="text-sm">{subQ.question}</p>

                                {/* Sub Question Options */}
                                {subQ.subQuestionType === 'multiple-choice' && subQ.options && subQ.options.length > 0 && (
                                  <RadioGroup value={subQ.correctAnswer}>
                                    <div className="space-y-2">
                                      {subQ.options.map((option, optIndex) => (
                                        <div
                                          key={optIndex}
                                          className={`flex items-center space-x-3 p-2 rounded border text-sm ${option === subQ.correctAnswer
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-gray-50'
                                            }`}
                                        >
                                          <RadioGroupItem value={option} id={`sub-${subIndex}-opt-${optIndex}`} disabled />
                                          <Label
                                            htmlFor={`sub-${subIndex}-opt-${optIndex}`}
                                            className="flex-1 cursor-pointer text-xs"
                                          >
                                            <span className="font-semibold mr-2">
                                              {String.fromCharCode(65 + optIndex)}.
                                            </span>
                                            {option}
                                          </Label>
                                          {option === subQ.correctAnswer && (
                                            <Badge variant="default" className="bg-green-600 text-xs">
                                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                              Correct
                                            </Badge>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </RadioGroup>
                                )}

                                {/* True/False */}
                                {subQ.subQuestionType === 'true-false' && (
                                  <div className="space-y-2">
                                    <RadioGroup value={subQ.correctAnswer}>
                                      {['True', 'False', 'Not Given'].map((option) => (
                                        <div
                                          key={option}
                                          className={`flex items-center space-x-3 p-2 rounded border text-sm ${option === subQ.correctAnswer
                                            ? 'bg-green-50 border-green-200'
                                            : 'bg-gray-50'
                                            }`}
                                        >
                                          <RadioGroupItem value={option} id={`sub-${subIndex}-${option}`} disabled />
                                          <Label htmlFor={`sub-${subIndex}-${option}`} className="flex-1 text-xs">
                                            {option}
                                          </Label>
                                          {option === subQ.correctAnswer && (
                                            <Badge variant="default" className="bg-green-600 text-xs">
                                              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                              Correct
                                            </Badge>
                                          )}
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </div>
                                )}

                                {/* Fill in the Blank / Short Answer */}
                                {(subQ.subQuestionType === 'fill-blank' || subQ.subQuestionType === 'short-answer') && subQ.correctAnswer && (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                                    <Label className="text-xs font-medium text-green-700 mb-1 block">
                                      Correct Answer
                                    </Label>
                                    <p className="text-sm font-medium">{subQ.correctAnswer}</p>
                                  </div>
                                )}

                                {/* Explanation */}
                                {subQ.explanation && (
                                  <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                                    <Label className="text-xs font-medium text-blue-700 mb-1 block">
                                      Explanation
                                    </Label>
                                    <p className="text-xs text-blue-900">{subQ.explanation}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Answer for other question types */}
                    {!currentQuestion.hasSubQuestions && (currentQuestion.subType === 'fill-blank' || currentQuestion.subType === 'short-answer') && currentQuestion.correctAnswer && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <Label className="text-sm font-semibold text-green-700 mb-2 block">
                          Correct Answer
                        </Label>
                        <p className="text-sm font-medium">{currentQuestion.correctAnswer}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Navigation Buttons */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentQuestionIndex === 0}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        {currentQuestionIndex + 1} / {questions.length}
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleNext}
                        disabled={currentQuestionIndex >= questions.length - 1}
                      >
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
