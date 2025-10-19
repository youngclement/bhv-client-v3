'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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

// API Response wrapper for single question fetch
interface QuestionResponse {
  type: 'reading' | 'listening' | 'writing' | 'speaking' | 'full';
  questionNumber: number;
  totalQuestions: number;
  hasNext: boolean;
  hasPrevious: boolean;
  question: Question;
}

interface Question {
  _id: string;
  testId: string;
  questionNumber?: number;
  // Backend schema: reading, listening, writing, speaking, full
  type: 'reading' | 'listening' | 'writing' | 'speaking' | 'full';
  subType: 'multiple-choice' | 'fill-blank' | 'matching' | 'short-answer' | 'composite' | 'true-false';
  question: string;
  instructionText?: string;
  explanation?: string;
  passage?: string; // Reading passage text
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
  subQuestions: Array<{
    _id?: string;
    subQuestionNumber: number;
    subQuestionType: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer';
    type?: 'multiple-choice' | 'fill-blank' | 'true-false' | 'short-answer'; // Legacy field
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
  createdBy: string; // User ID
  __v?: number; // MongoDB version field
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Student answer tracking
  answer?: string;
  timeSpent?: number;
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
  type: 'reading' | 'listening' | 'writing' | 'speaking' | 'full';
  duration: number;
  questions: Question[];
  passages?: Passage[];
}

export default function TakeTestPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [test, setTest] = useState<Test | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentPassage, setCurrentPassage] = useState<Passage | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1); // 1-based to match API
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [user, setUser] = useState<any>(null);

  // Auto-save refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingAnswersRef = useRef<Record<string, string>>({});
  const testIdFromUrl = params.testId as string; // Lấy từ URL path: /take-test/[testId]
  const assignmentFromQuery = searchParams.get('assignment');

  // Get assignmentId from localStorage first, then fallback to query param
  const getAssignmentId = () => {
    if (testIdFromUrl) {
      const storedAssignmentId = localStorage.getItem(`bhv-assignment-${testIdFromUrl}`);
      if (storedAssignmentId) {
        console.log(`📱 Found assignmentId ${storedAssignmentId} in localStorage for testId ${testIdFromUrl}`);
        return storedAssignmentId;
      }
    }

    // Fallback về query param nếu localStorage không có
    if (assignmentFromQuery) {
      return assignmentFromQuery;
    }
    return null;
  };

  const assignmentId = getAssignmentId();

  // localStorage key for saving answers
  const getLocalStorageKey = () => `bhv-test-answers-${test?._id || 'unknown'}-${submissionId}`;

  // Load answers from localStorage
  const loadAnswersFromStorage = useCallback(() => {
    try {
      const key = getLocalStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsedAnswers = JSON.parse(stored);
        setAnswers(parsedAnswers);
        console.log('📱 Loaded answers from localStorage:', Object.keys(parsedAnswers).length, 'answers');
        return parsedAnswers;
      }
    } catch (error) {
      console.error('Failed to load answers from localStorage:', error);
    }
    return {};
  }, [params.testId, submissionId]);

  // Save answers to localStorage
  const saveAnswersToStorage = useCallback((answersToSave: Record<string, string>) => {
    try {
      const key = getLocalStorageKey();
      localStorage.setItem(key, JSON.stringify(answersToSave));
      console.log('💾 Saved answers to localStorage:', Object.keys(answersToSave).length, 'answers');
    } catch (error) {
      console.error('Failed to save answers to localStorage:', error);
    }
  }, [params.testId, submissionId]);

  // Auto-save to localStorage with debounce
  const autoSaveToStorage = useCallback(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for 1 second (faster than server auto-save)
    saveTimeoutRef.current = setTimeout(() => {
      saveAnswersToStorage(answers);
    }, 1000);
  }, [answers, saveAnswersToStorage]);

  // Store question data for answer formatting
  const questionsCache = useRef<Map<string, Question>>(new Map());

  // Store question data when loaded
  const storeQuestionData = useCallback((question: Question) => {
    questionsCache.current.set(question._id, question);
  }, []);

  // Format answers from localStorage for submission
  const formatAnswersForSubmission = useCallback(async () => {
    const formattedAnswers: any[] = [];
    const questionMap = new Map();

    // Group answers by main question ID
    Object.entries(answers).forEach(([key, answer]) => {
      if (key.includes('-sub-')) {
        // This is a sub-question answer
        const [mainQuestionId, subPart] = key.split('-sub-');
        const subQuestionNumber = parseInt(subPart);

        if (!questionMap.has(mainQuestionId)) {
          questionMap.set(mainQuestionId, {
            questionId: mainQuestionId,
            subAnswers: []
          });
        }

        // Try to find the question data from cache or current question
        let questionData = questionsCache.current.get(mainQuestionId);
        if (!questionData && currentQuestion && currentQuestion._id === mainQuestionId) {
          questionData = currentQuestion;
        }

        if (questionData && questionData.subQuestions) {
          const subQuestion = questionData.subQuestions.find(sq =>
            sq.subQuestionNumber === subQuestionNumber ||
            questionData!.subQuestions!.indexOf(sq) === (subQuestionNumber - 1)
          );

          if (subQuestion && subQuestion._id) {
            questionMap.get(mainQuestionId).subAnswers.push({
              subQuestionId: subQuestion._id,
              answer: answer
            });
          } else {
            // Fallback: use composite format if no _id available
            console.warn(`No subQuestion._id found for ${mainQuestionId}-sub-${subQuestionNumber}, using fallback`);
            questionMap.get(mainQuestionId).subAnswers.push({
              subQuestionId: `${mainQuestionId}-sub-${subQuestionNumber}`,
              answer: answer
            });
          }
        }
      } else {
        // This is a main question answer (extract questionId from key format)
        let questionId = key;
        if (key.includes(':')) {
          questionId = key.split(':')[0];
        }

        if (!questionMap.has(questionId)) {
          questionMap.set(questionId, {
            questionId: questionId,
            answer: answer
          });
        } else {
          // Add main answer to existing entry
          questionMap.get(questionId).answer = answer;
        }
      }
    });

    // Convert map to array
    questionMap.forEach((value) => {
      formattedAnswers.push(value);
    });

    return {
      testId: test?._id || '', // Use actual testId from test object
      userId: user?._id || user?.id,
      assignmentId: assignmentId,
      answers: formattedAnswers
    };
  }, [answers, test?.questions, test?._id, user, assignmentId]);

  useEffect(() => {
    if (testIdFromUrl || assignmentId) {
      initializeTest();
    }
  }, [testIdFromUrl, assignmentId]);

  // Load saved answers from localStorage when submissionId is available
  useEffect(() => {
    if (submissionId && test?._id) {
      loadAnswersFromStorage();
    }
  }, [submissionId, test?._id, loadAnswersFromStorage]);

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

  // Cleanup timeouts khi component unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  // Debug: Log current question and sub-questions
  useEffect(() => {
    if (currentQuestion) {
      console.log('Current Question:', currentQuestion);
      if (currentQuestion.subType === 'composite' && currentQuestion.subQuestions) {
        console.log('Sub-questions count:', currentQuestion.subQuestions.length);
        console.log('Sub-questions:', currentQuestion.subQuestions);
      }
    }
  }, [currentQuestion]);

  const initializeTest = async () => {
    try {
      console.log('🚀 Initializing test...');
      console.log('assignmentId:', assignmentId);
      console.log('testIdFromUrl:', testIdFromUrl);

      if (!authService.isAuthenticated()) {
        router.push('/login');
        return;
      }

      // Sử dụng testId từ URL path
      let actualTestId = testIdFromUrl;

      if (!actualTestId) {
        setError('Test ID not found in URL');
        setLoading(false);
        return;
      }

      // Get user profile
      try {
        const userProfile = await authService.getProfile();
        setUser(userProfile);
      } catch (error) {
        console.error('Failed to get user profile:', error);
      }

      // Load first question to get test info and submission info
      let firstQuestionResponse;
      try {
        console.log(`🔄 Calling API: /tests/${actualTestId}/questions/1`);
        firstQuestionResponse = await authService.apiRequest(`/tests/${actualTestId}/questions/1`);
        console.log('Loaded first question:', firstQuestionResponse);
      } catch (error) {
        console.error('Failed to fetch first question:', error);
        setLoading(false);
        return;
      }

      // Extract test info, submission info, and pagination from first question response
      const testInfo = firstQuestionResponse.testInfo;
      const submissionInfo = firstQuestionResponse.submissionInfo;
      const pagination = firstQuestionResponse.pagination;
      const firstQuestion = firstQuestionResponse.questions?.[0];

      console.log('Test info:', testInfo);
      console.log('Pagination:', pagination);

      setTest({
        _id: testInfo._id,
        title: testInfo.title,
        description: '',
        type: testInfo.type,
        duration: testInfo.duration,
        questions: [], // Will be loaded individually
        passages: []
      });

      setTotalQuestions(pagination.totalQuestions);

      // Set first question
      if (firstQuestion) {
        console.log('✅ Found first question:', firstQuestion);

        const processedFirstQuestion = {
          ...firstQuestion,
          answer: '',
          timeSpent: 0
        };

        // Store first question data for later use in submission formatting
        storeQuestionData(processedFirstQuestion);

        setCurrentQuestion(processedFirstQuestion);
        setCurrentQuestionIndex(1);
        setHasNext(pagination.hasNext);
        setHasPrevious(pagination.hasPrevious);
        console.log('✅ Set current question successfully');
      } else {
        console.error('❌ No first question in response!');
      }

      // Check if we have submission info from metadata API
      if (submissionInfo?.submissionId) {
        // Continue existing submission
        console.log('Continuing existing submission:', submissionInfo.submissionId);
        setSubmissionId(submissionInfo.submissionId);

        // Extract time remaining (handle both object and number formats)
        let remainingSeconds = testInfo.duration * 60;
        if (submissionInfo?.timeRemaining) {
          if (typeof submissionInfo.timeRemaining === 'object' && submissionInfo.timeRemaining.totalSeconds !== undefined) {
            remainingSeconds = submissionInfo.timeRemaining.totalSeconds;
          } else if (typeof submissionInfo.timeRemaining === 'number') {
            remainingSeconds = submissionInfo.timeRemaining;
          }
        }

        // Check if time has expired
        if (remainingSeconds === 0) {
          setError('Your test time has expired. The submission has been automatically completed.');
          setLoading(false);
          return;
        }

        // Use remaining time from submission info
        setTimeRemaining(remainingSeconds);

      } else {
        // Không có submission info, khởi tạo với thời gian mặc định
        console.log('No submission info, using default test duration');
        const remainingSeconds = testInfo.duration * 60;
        setTimeRemaining(remainingSeconds);

        // Tạo submissionId giả để localStorage hoạt động
        const fakeSubmissionId = `fake-${testInfo._id}-${Date.now()}`;
        setSubmissionId(fakeSubmissionId);
        console.log('Created fake submissionId for localStorage:', fakeSubmissionId);
      }

      console.log('✅ Test initialization complete');
      setQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Failed to initialize test:', error);
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  };



  // Load individual question by number via API
  const loadQuestion = async (questionNumber: number) => {
    if (!test) {
      console.error('No test available');
      return null;
    }

    setLoadingQuestion(true);
    try {
      console.log(`🔄 Loading question ${questionNumber} from API`);
      const response = await authService.apiRequest(`/tests/${test._id}/questions/${questionNumber}`);

      const questionData = response.questions?.[0];
      const pagination = response.pagination;

      if (questionData) {
        console.log(`✅ Loaded question ${questionNumber}:`, questionData);

        const processedQuestion = {
          ...questionData,
          answer: '',
          timeSpent: 0
        };

        // Store question data for later use in submission formatting
        storeQuestionData(processedQuestion);

        setCurrentQuestion(processedQuestion);
        setCurrentQuestionIndex(questionNumber);
        setHasNext(pagination.hasNext);
        setHasPrevious(pagination.hasPrevious);

        return processedQuestion;
      } else {
        console.error(`❌ Question ${questionNumber} not found in API response`);
        return null;
      }
    } catch (error) {
      console.error(`Failed to load question ${questionNumber}:`, error);
      return null;
    } finally {
      setLoadingQuestion(false);
    }
  };

  // Backend API: PUT /api/submissions/:submissionId/answer (only for manual save)
  const saveAnswer = useCallback(async (questionId: string, answer: string, isAutoSave = false) => {
    if (!submissionId) return;

    if (!isAutoSave) {
      setSaving(true);
    }

    try {
      await authService.saveAnswer(submissionId, questionId, answer);

      if (!isAutoSave) {
        console.log('✅ Answer saved to server successfully');
      }
    } catch (error) {
      console.error('Failed to save answer to server:', error);
    } finally {
      if (!isAutoSave) {
        setSaving(false);
      }
    }
  }, [submissionId]);

  // Auto-save to localStorage instead of server
  const autoSaveAnswer = useCallback((questionId: string, answer: string) => {
    console.log(`💾 Auto-saving answer for question ${questionId} to localStorage`);
    // Auto-save will be triggered by the useEffect watching answers changes
    autoSaveToStorage();
  }, [autoSaveToStorage]);

  // Batch save all answers to server (only when needed)
  const saveAllAnswersToServer = useCallback(async () => {
    const answersToSave = { ...answers };
    const answerCount = Object.keys(answersToSave).length;

    if (answerCount === 0) return;

    console.log(`🔄 Saving ${answerCount} answers to server...`);
    setSaving(true);

    try {
      for (const [key, answer] of Object.entries(answersToSave)) {
        // Extract the real questionId from the UI key format
        let questionId = key;
        if (key.includes(':')) {
          questionId = key.split(':')[0];
        }

        await saveAnswer(questionId, answer, true);
      }
      console.log('✅ All answers saved to server successfully');
    } catch (error) {
      console.error('Failed to save answers to server:', error);
    } finally {
      setSaving(false);
    }
  }, [answers, saveAnswer]);

  // Auto-save to localStorage whenever answers change
  useEffect(() => {
    if (submissionId && Object.keys(answers).length > 0) {
      autoSaveToStorage();
    }
  }, [answers, submissionId, autoSaveToStorage]);

  // Periodic save to server every 30 seconds (optional backup)
  useEffect(() => {
    if (submissionId) {
      console.log('🔄 Setting up periodic backup to server every 30 seconds');

      autoSaveIntervalRef.current = setInterval(() => {
        const answerCount = Object.keys(answers).length;
        if (answerCount > 0) {
          console.log(`💾 Periodic backup: saving ${answerCount} answers to server`);
          saveAllAnswersToServer();
        }
      }, 30000); // Backup to server every 30 seconds

      return () => {
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      };
    }
  }, [submissionId, answers, saveAllAnswersToServer]);

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    // Auto-save to localStorage will be triggered by useEffect
  };

  // For typing questions: update local only; auto-save to localStorage
  const handleAnswerChangeLocal = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    // Auto-save to localStorage will be triggered by useEffect
  };

  const handleAnswerCommit = (questionId: string) => {
    const value = answers[questionId] || '';
    console.log(`💾 Committing answer for question ${questionId} to server immediately`);
    // Save immediately to server on blur
    saveAnswer(questionId, value, false);
  };

  const handleNextQuestion = async () => {
    if (hasNext && currentQuestionIndex < totalQuestions) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      await loadQuestion(nextIndex);
      setQuestionStartTime(Date.now());
    }
  };

  const handlePreviousQuestion = async () => {
    if (hasPrevious && currentQuestionIndex > 1) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      await loadQuestion(prevIndex);
      setQuestionStartTime(Date.now());
    }
  };

  const updateCurrentPassage = (questionIndex: number) => {
    // For now, we don't use passages since questions come directly from API
    setCurrentPassage(null);
  };

  const handleSubmitTest = async () => {
    if (!submissionId) return;

    try {
      console.log('📤 Submitting test - formatting answers from localStorage...');

      // Format answers from localStorage according to new structure
      const formattedSubmission = await formatAnswersForSubmission();
      console.log('📋 Formatted submission data:', formattedSubmission);

      // Submit with formatted data using new endpoint
      const response = await authService.apiRequest(`/submissions/submit-with-answers`, {
        method: 'POST',
        body: JSON.stringify({
          ...formattedSubmission,
          assignmentId: assignmentId
        })
      });

      // Clear localStorage after successful submission
      try {
        const key = getLocalStorageKey();
        localStorage.removeItem(key);
        console.log('🗑️ Cleared localStorage after successful submission');
      } catch (error) {
        console.error('Failed to clear localStorage:', error);
      }

      router.push(`/submissions`);
    } catch (error) {
      console.error('Failed to submit test:', error);
      // For demo, navigate anyway - but could show error message
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
      case 'speaking': return <Volume2 className="h-4 w-4" />;
      case 'full': return <BookOpen className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 pb-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-primary"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Loading Test</h3>
                <p className="text-sm text-muted-foreground">
                  Please wait while we prepare your test...
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

  // Show error if test time has expired
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full mx-4">
          <div className="text-red-600 mb-4">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-700 mb-2">Test Expired</h2>
          </div>
          <p className="text-gray-600 mb-6 leading-relaxed">
            {error}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push('/submissions')}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tests
            </Button>
          </div>
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

  const getAnswerKey = (q?: Question | null, index?: number) => {
    if (!q) return '';
    const uniquePart = q.questionNumber || ((index ?? currentQuestionIndex) + 1);
    return `${q._id}:${uniquePart}`;
  };
  const currentAnswerKey = getAnswerKey(currentQuestion, currentQuestionIndex);
  // UI answer helpers: save to localStorage, manual server save on commit
  const handleSelectAnswer = (question: Question, index: number, value: string) => {
    const key = getAnswerKey(question, index);
    setAnswers(prev => ({ ...prev, [key]: value }));
    // Auto-save to localStorage will be triggered by useEffect
  };

  const handleLocalInputChange = (question: Question, index: number, value: string) => {
    const key = getAnswerKey(question, index);
    setAnswers(prev => ({ ...prev, [key]: value }));
    // Auto-save to localStorage will be triggered by useEffect
  };

  const handleLocalInputCommit = (question: Question, index: number) => {
    const key = getAnswerKey(question, index);
    const value = answers[key] || '';
    // Save immediately to server on blur
    console.log(`💾 Committing answer for question ${question._id} to server immediately`);
    saveAnswer(question._id, value, false);
  };
  const progress = totalQuestions > 0 ? (currentQuestionIndex / totalQuestions) * 100 : 0;
  const answeredCount = Object.keys(answers).length;


  // Loading state
  if (loading || !test) {
    console.log('⏳ Still loading or no test:', { loading, hasTest: !!test });
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Test...</h2>
          <p className="text-gray-600">Please wait while we prepare your test.</p>
        </div>
      </div>
    );
  }

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
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
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
                  Question {currentQuestionIndex}
                </span>
                <span className="text-sm text-slate-500">
                  of {totalQuestions}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-[#004875] text-white hover:bg-[#003a5c]">
                  {answeredCount}/{totalQuestions} Answered
                </Badge>
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Auto-saved locally</span>
                </div>
              </div>
            </div>
            <Progress value={progress} className="h-2.5" />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Question Content - Full Height with Scroll */}
          <div className="lg:col-span-3 space-y-6">
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
                      Q{currentQuestion?.questionNumber || (currentQuestionIndex + 1)}
                    </Badge>
                    <Badge variant="secondary" className="capitalize bg-slate-200 text-slate-700 font-medium">
                      {((currentQuestion?.subType || currentQuestion?.type) || 'unknown').replace(/-/g, ' ')}
                    </Badge>
                    <span className="text-sm text-slate-600 font-normal">
                      {currentQuestion?.points || 1} point{(currentQuestion?.points || 1) > 1 ? 's' : ''}
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {loadingQuestion && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Loading...
                      </div>
                    )}
                    {saving && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Save className="h-4 w-4 animate-pulse text-[#004875]" />
                        Saving to server...
                      </div>
                    )}
                    {Object.keys(answers).length > 0 && !saving && (
                      <div className="flex items-center gap-1.5 text-sm text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs">Saved locally</span>
                      </div>
                    )}
                  </div>
                </div>
                {currentQuestion?.instructionText && (
                  <CardDescription className="text-sm text-slate-600 mt-2 leading-relaxed">
                    {currentQuestion.instructionText}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {loadingQuestion ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-sm text-slate-600">Loading question...</p>
                    </div>
                  </div>
                ) : !currentQuestion ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-orange-500" />
                      <p className="text-sm text-slate-600">Question not found</p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="pr-4">
                    <div className="space-y-6">

                      {/* Question */}
                      <div className="space-y-4">
                        {/* Audio Player - Show for any question with audio */}
                        {currentQuestion?.audioFile?.url && (
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Volume2 className="h-5 w-5 text-gray-700" />
                              <Label className="text-sm font-semibold text-slate-700">
                                Audio
                              </Label>
                              {currentQuestion?.section && (
                                <Badge variant="outline" className="ml-2">
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

                        {/* Image - Show for any question with image */}
                        {currentQuestion?.imageFile?.url && (
                          <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Label className="text-sm font-semibold text-slate-700">
                                Image
                              </Label>
                            </div>
                            <div className="rounded-lg border border-slate-200 overflow-hidden">
                              <img
                                src={currentQuestion.imageFile.url}
                                alt={currentQuestion.imageFile.originalName || 'Question image'}
                                className="w-full h-auto max-h-96 object-contain"
                              />
                            </div>
                          </div>
                        )}

                        {/* Reading Passage */}
                        {currentQuestion?.passage && (
                          <div className="mb-6 p-5 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <BookOpen className="h-5 w-5 text-gray-700" />
                              <Label className="text-sm font-semibold">
                                Reading Passage
                              </Label>
                            </div>
                            <div className="prose prose-sm max-w-none">
                              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {currentQuestion.passage}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="pb-2 border-b border-slate-200">
                          <Label className="text-base font-semibold text-slate-900 leading-relaxed">
                            {currentQuestion?.question}
                          </Label>
                          {currentQuestion?.instructionText && (
                            <p className="text-sm text-slate-600 mt-2 italic">
                              {currentQuestion.instructionText}
                            </p>
                          )}
                          {currentQuestion?.wordLimit && (
                            <Badge variant="outline" className="mt-2">
                              Word limit: {currentQuestion.wordLimit} words
                            </Badge>
                          )}
                        </div>

                        {/* Answer Input - Handle both composite and regular questions */}

                        {/* Composite Questions with Sub-questions */}
                        {currentQuestion?.subType === 'composite' && currentQuestion?.subQuestions && currentQuestion.subQuestions.length > 0 && (
                          <div className="space-y-4">
                            <div className="p-4 rounded-lg border border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">
                                  Composite Question
                                </Badge>
                                <span className="text-sm text-gray-700">
                                  {currentQuestion.subQuestions.length} sub-questions
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                This question contains multiple sub-questions. Answer each one below.
                              </p>
                            </div>

                            {currentQuestion.subQuestions.map((subQ, subIndex) => (
                              <div key={subQ._id || `sub-${subIndex}-${subQ.subQuestionNumber || subIndex}`} className="p-4 rounded-lg border border-slate-200 space-y-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {subQ.subQuestionNumber || (subIndex + 1)}
                                  </Badge>
                                  <Label className="text-sm font-medium">
                                    {subQ.question}
                                  </Label>
                                </div>

                                {/* Sub-question answer input based on type */}
                                {subQ.subQuestionType === 'multiple-choice' && subQ.options && subQ.options.length > 0 ? (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-2">Select one answer:</p>
                                    <RadioGroup
                                      value={answers[`${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`] || ''}
                                      onValueChange={(value) => {
                                        const key = `${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`;
                                        setAnswers(prev => ({ ...prev, [key]: value }));
                                        // Auto-save to localStorage will be triggered by useEffect
                                      }}
                                      className="space-y-2"
                                    >
                                      {subQ.options.map((option, optIndex) => (
                                        <div key={optIndex} className="flex items-center space-x-3 py-1">
                                          <RadioGroupItem
                                            value={option}
                                            id={`sub-${subIndex}-${optIndex}`}
                                          />
                                          <Label
                                            htmlFor={`sub-${subIndex}-${optIndex}`}
                                            className="cursor-pointer font-medium flex-1"
                                          >
                                            {option}
                                          </Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </div>
                                ) : subQ.subQuestionType === 'true-false' || (subQ.options && subQ.options.length >= 2 && subQ.options.includes('True')) ? (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-2">True / False / Not Given:</p>
                                    <RadioGroup
                                      value={answers[`${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`] || ''}
                                      onValueChange={(value) => {
                                        const key = `${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`;
                                        setAnswers(prev => ({ ...prev, [key]: value }));
                                        // Auto-save to localStorage will be triggered by useEffect
                                      }}
                                      className="space-y-2"
                                    >
                                      <div className="flex items-center space-x-3 py-1">
                                        <RadioGroupItem value="True" id={`sub-${subIndex}-true`} />
                                        <Label htmlFor={`sub-${subIndex}-true`} className="cursor-pointer font-medium">
                                          True
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-3 py-1">
                                        <RadioGroupItem value="False" id={`sub-${subIndex}-false`} />
                                        <Label htmlFor={`sub-${subIndex}-false`} className="cursor-pointer font-medium">
                                          False
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-3 py-1">
                                        <RadioGroupItem value="Not Given" id={`sub-${subIndex}-notgiven`} />
                                        <Label htmlFor={`sub-${subIndex}-notgiven`} className="cursor-pointer font-medium">
                                          Not Given
                                        </Label>
                                      </div>
                                    </RadioGroup>
                                  </div>
                                ) : subQ.subQuestionType === 'fill-blank' || subQ.subQuestionType === 'short-answer' ? (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-2">Type your answer:</p>
                                    <Input
                                      placeholder={`Answer for sub-question ${subQ.subQuestionNumber || (subIndex + 1)}...`}
                                      value={answers[`${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`] || ''}
                                      onChange={(e) => {
                                        const key = `${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`;
                                        setAnswers(prev => ({ ...prev, [key]: e.target.value }));
                                        // Auto-save to localStorage will be triggered by useEffect
                                      }}
                                      onBlur={() => {
                                        const key = `${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`;
                                        const value = answers[key] || '';
                                        // Save immediately to server on blur
                                        console.log(`💾 Committing sub-question answer to server immediately`);
                                        saveAnswer(subQ._id || `${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`, value, false);
                                      }}
                                      className="border-slate-300 focus:border-[#004875] focus:ring-[#004875]"
                                    />
                                  </div>
                                ) : (
                                  // Default to text input if type is unclear
                                  <div>
                                    <p className="text-xs text-gray-500 mb-2">Type your answer:</p>
                                    <Input
                                      placeholder={`Answer for sub-question ${subQ.subQuestionNumber || (subIndex + 1)}...`}
                                      value={answers[`${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`] || ''}
                                      onChange={(e) => {
                                        const key = `${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`;
                                        setAnswers(prev => ({ ...prev, [key]: e.target.value }));
                                        // Auto-save to localStorage will be triggered by useEffect
                                      }}
                                      onBlur={() => {
                                        const key = `${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`;
                                        const value = answers[key] || '';
                                        // Save immediately to server on blur
                                        console.log(`💾 Committing sub-question answer to server immediately`);
                                        saveAnswer(subQ._id || `${currentQuestion._id}-sub-${subQ.subQuestionNumber || subIndex}`, value, false);
                                      }}
                                      className="border-slate-300 focus:border-[#004875] focus:ring-[#004875]"
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Regular Multiple Choice Questions */}
                        {currentQuestion?.subType === 'multiple-choice' && currentQuestion?.options && currentQuestion.options.length > 0 && (
                          <RadioGroup
                            value={answers[currentAnswerKey] || ''}
                            onValueChange={(value) => handleSelectAnswer(currentQuestion, currentQuestionIndex, value)}
                            className="space-y-2 pt-2"
                          >
                            {currentQuestion.options.map((option, index) => (
                              <div key={index} className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value={option} id={`option-${currentQuestionIndex}-${index}`} />
                                <Label htmlFor={`option-${currentQuestionIndex}-${index}`} className="cursor-pointer font-medium flex-1 leading-relaxed">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}

                        {/* True/False Questions */}
                        {currentQuestion?.subType === 'true-false' && (
                          <RadioGroup
                            value={answers[currentAnswerKey] || ''}
                            onValueChange={(value) => handleSelectAnswer(currentQuestion, currentQuestionIndex, value)}
                            className="space-y-2 pt-2"
                          >
                            <div className="flex items-center space-x-3 py-2">
                              <RadioGroupItem value="True" id={`option-${currentQuestionIndex}-true`} />
                              <Label htmlFor={`option-${currentQuestionIndex}-true`} className="cursor-pointer font-medium flex-1 leading-relaxed">
                                True
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3 py-2">
                              <RadioGroupItem value="False" id={`option-${currentQuestionIndex}-false`} />
                              <Label htmlFor={`option-${currentQuestionIndex}-false`} className="cursor-pointer font-medium flex-1 leading-relaxed">
                                False
                              </Label>
                            </div>
                          </RadioGroup>
                        )}

                        {/* Short Answer / Fill Blank / Matching */}
                        {(currentQuestion?.subType === 'short-answer' ||
                          currentQuestion?.subType === 'fill-blank' ||
                          currentQuestion?.subType === 'matching') && (
                            <Input
                              placeholder="Type your answer here..."
                              value={answers[currentAnswerKey] || ''}
                              onChange={(e) => handleLocalInputChange(currentQuestion, currentQuestionIndex, e.target.value)}
                              onBlur={() => handleLocalInputCommit(currentQuestion, currentQuestionIndex)}
                              className="border-slate-300 focus:border-[#004875] focus:ring-[#004875] text-base py-5"
                            />
                          )}
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </CardContent>

              {/* Navigation - Moved here for better UX */}
              <CardContent className="border-t border-slate-100 bg-slate-50/30 py-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handlePreviousQuestion}
                    disabled={!hasPrevious}
                    className="flex-1 border-slate-300 hover:bg-slate-100 disabled:opacity-40"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleNextQuestion}
                    disabled={!hasNext}
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
                    {Array.from({ length: totalQuestions }, (_, index) => {
                      const questionNumber = index + 1;
                      // We don't have access to individual questions anymore, so just check if answer exists
                      const isAnswered = !!answers[`question-${questionNumber}`] ||
                        Object.keys(answers).some(key => key.includes(`${questionNumber}:`));
                      const isCurrent = currentQuestionIndex === questionNumber;

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
                          onClick={async () => {
                            setCurrentQuestionIndex(questionNumber);
                            await loadQuestion(questionNumber);
                            setQuestionStartTime(Date.now());
                          }}
                        >
                          {questionNumber}
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
                        Are you sure you want to submit your test? You have answered {answeredCount} out of {totalQuestions} questions.
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