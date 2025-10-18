'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  BookOpen, 
  Volume2, 
  PenTool, 
  Play,
  Clock,
  FileText,
  Users,
  Plus,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface Test {
  _id: string;
  title: string;
  description: string;
  type: 'reading' | 'listening' | 'writing' | 'mixed';
  duration: number;
  totalQuestions: number;
  totalPoints: number;
  isActive: boolean;
  status: 'draft' | 'published' | 'archived';
  questions: any[];
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Question {
  _id: string;
  testId: string;
  questionNumber: number;
  type: 'reading' | 'listening' | 'writing' | 'mixed';
  subType: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  section: number;
  markingType: 'auto' | 'manual';
  isActive: boolean;
  createdBy: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface QuestionsResponse {
  questions: Question[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  testInfo: {
    _id: string;
    title: string;
    type: string;
    status: string;
    totalQuestions: number;
    totalPoints: number;
  };
  summary: {
    totalQuestions: number;
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
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Test>>({});
  
  // Questions state
  const [questionsData, setQuestionsData] = useState<QuestionsResponse | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Question detail dialog state
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [questionEditData, setQuestionEditData] = useState<Partial<Question>>({});
  const [savingQuestion, setSavingQuestion] = useState(false);

  const fetchTest = useCallback(async (id: string) => {
    try {
      console.log('Fetching test with id:', id);
      const data = await authService.apiRequest(`/tests/${id}`);
      console.log('Test data received:', data);
      setTest(data);
      setEditData(data);
    } catch (error) {
      console.error('Failed to fetch test:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQuestions = useCallback(async (id: string) => {
    try {
      console.log('Fetching questions for test id:', id);
      const data = await authService.apiRequest(`/tests/${id}/questions/all`);
      console.log('Questions data received:', data);
      setQuestionsData(data);
      setQuestions(data.questions);
      
      // Update test with summary info
      if (data.testInfo) {
        setTest(prev => prev ? {
          ...prev,
          totalQuestions: data.testInfo.totalQuestions,
          totalPoints: data.testInfo.totalPoints
        } : null);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  }, []);

  useEffect(() => {
    console.log('useEffect triggered with params.id:', params.id);
    const loadTestData = async () => {
      if (params.id) {
        console.log('Loading test data for:', params.id);
        await fetchTest(params.id as string);
        await fetchQuestions(params.id as string);
      }
    };
    loadTestData();
  }, [params.id, fetchTest, fetchQuestions]);


  const handleSave = async () => {
    if (!test) return;
    
    setSaving(true);
    try {
      await authService.apiRequest(`/tests/${test._id}`, {
        method: 'PUT',
        body: JSON.stringify(editData),
      });

      await fetchTest(test._id);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update test:', error);
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async () => {
    if (!test) return;

    try {
      await authService.apiRequest(`/tests/${test._id}`, {
        method: 'DELETE',
      });
      router.push('/dashboard/tests');
    } catch (error) {
      console.error('Failed to delete test:', error);
    }
  };

  // Question detail handlers
  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionEditData(question);
    setIsEditingQuestion(false);
    setIsQuestionDialogOpen(true);
  };

  const handleEditQuestion = () => {
    setIsEditingQuestion(true);
  };

  const handleSaveQuestion = async () => {
    if (!selectedQuestion) return;

    setSavingQuestion(true);
    try {
      await authService.apiRequest(`/questions/${selectedQuestion._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionEditData.question,
          points: questionEditData.points,
          difficulty: questionEditData.difficulty,
          options: questionEditData.options,
          correctAnswer: questionEditData.correctAnswer,
          tags: questionEditData.tags,
          section: questionEditData.section,
        }),
      });

      // Refresh questions list
      await fetchQuestions(test?._id as string);
      
      // Update selected question
      const updatedQuestion = { ...selectedQuestion, ...questionEditData };
      setSelectedQuestion(updatedQuestion);
      setIsEditingQuestion(false);
    } catch (error) {
      console.error('Failed to update question:', error);
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!selectedQuestion) return;

    try {
      await authService.apiRequest(`/questions/${selectedQuestion._id}`, {
        method: 'DELETE',
      });

      // Refresh questions list
      await fetchQuestions(test?._id as string);
      setIsQuestionDialogOpen(false);
      setSelectedQuestion(null);
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleCloseQuestionDialog = () => {
    setIsQuestionDialogOpen(false);
    setSelectedQuestion(null);
    setIsEditingQuestion(false);
    setQuestionEditData({});
  };

  const handleAddOption = () => {
    const currentOptions = questionEditData.options || [];
    setQuestionEditData({
      ...questionEditData,
      options: [...currentOptions, '']
    });
  };

  const handleRemoveOption = (index: number) => {
    const currentOptions = questionEditData.options || [];
    setQuestionEditData({
      ...questionEditData,
      options: currentOptions.filter((_, i) => i !== index)
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const currentOptions = [...(questionEditData.options || [])];
    currentOptions[index] = value;
    setQuestionEditData({
      ...questionEditData,
      options: currentOptions
    });
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = testTypes.find(t => t.value === type);
    return typeConfig ? <typeConfig.icon className="h-5 w-5" /> : null;
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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
        <Button onClick={() => router.push('/dashboard/tests')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tests
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/tests')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tests
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Test Details</h2>
            <p className="text-muted-foreground">View and manage test information</p>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => router.push(`/dashboard/tests/${test._id}/builder`)}
                className="bg-[#004875] text-white hover:bg-[#003a5c] border-[#004875]"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Test Builder
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Test
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Test</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this test? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getTypeIcon(test.type)}
                  <div>
                    <CardTitle>{test.title}</CardTitle>
                    <CardDescription>
                      {test.type.charAt(0).toUpperCase() + test.type.slice(1)} Test • {formatDuration(test.duration) ?? 'N/A' }
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={test.isActive ? "default" : "secondary"}>
                  {test.isActive ? "Active" : "Draft"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6 pr-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label>Test Title</Label>
                        <Input
                          value={editData.title || ''}
                          onChange={(e) => setEditData({...editData, title: e.target.value})}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={editData.description || ''}
                          onChange={(e) => setEditData({...editData, description: e.target.value})}
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Test Type</Label>
                          <Select 
                            value={editData.type} 
                            onValueChange={(value: any) => setEditData({...editData, type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {testTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div className="flex items-center gap-2">
                                    <type.icon className="h-4 w-4" />
                                    {type.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            min="1"
                            value={editData.duration || 60}
                            onChange={(e) => setEditData({...editData, duration: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={editData.isActive || false}
                          onCheckedChange={(checked) => setEditData({...editData, isActive: checked})}
                        />
                        <Label>Active (available for assignment)</Label>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm leading-relaxed">{test.description}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Questions ({questions.length})</h3>
                          <Button 
                            onClick={() => router.push(`/dashboard/tests/${test._id}/builder`)} 
                            size="sm"
                            className="bg-[#004875] hover:bg-[#003a5c]"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Manage Questions
                          </Button>
                        </div>
                        {questions && questions.length > 0 ? (
                          <div className="space-y-3">
                            {questions.map((question, index) => (
                              <div key={question._id} className="p-4 border rounded-lg hover:border-primary/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="outline" className="text-xs">
                                        #{question.questionNumber}
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        {question.type}
                                      </Badge>
                                      <Badge variant="secondary" className="text-xs">
                                        {question.points} pts
                                      </Badge>
                                      <Badge variant="outline" className="text-xs">
                                        Section {question.section}
                                      </Badge>
                                      <Badge 
                                        variant={question.difficulty === 'hard' ? 'destructive' : question.difficulty === 'medium' ? 'default' : 'secondary'} 
                                        className="text-xs"
                                      >
                                        {question.difficulty}
                                      </Badge>
                                    </div>
                                    <p className="text-sm font-medium mb-1 line-clamp-2">{question.question}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {question.subType?.replace('-', ' ')} • {question.markingType} marking
                                    </p>
                                    {question.tags && question.tags.length > 0 && (
                                      <div className="flex gap-1 mt-2">
                                        {question.tags.slice(0, 3).map((tag, tagIndex) => (
                                          <Badge key={tagIndex} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                        {question.tags.length > 3 && (
                                          <Badge variant="outline" className="text-xs">
                                            +{question.tags.length - 3}
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleViewQuestion(question)}
                                      className="whitespace-nowrap"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Details
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => router.push(`/dashboard/tests/${test._id}/question/${question._id}/edit`)}
                                      className="whitespace-nowrap"
                                    >
                                      <Edit2 className="h-3 w-3 mr-1" />
                                      Edit
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <div className="space-y-2">
                              <p>No questions added to this test yet</p>
                              <Button 
                                onClick={() => router.push(`/dashboard/tests/${test._id}/builder`)} 
                                size="sm"
                                className="bg-[#004875] hover:bg-[#003a5c]"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Start Building
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Questions Summary */}
          {questionsData && (
            <Card>
              <CardHeader>
                <CardTitle>Questions Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{questionsData.summary.totalQuestions}</div>
                    <div className="text-xs text-muted-foreground">Total Questions</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl font-bold text-primary">{questionsData.summary.bySection.reduce((sum, item) => sum + item.totalPoints, 0)}</div>
                    <div className="text-xs text-muted-foreground">Total Points</div>
                  </div>
                </div>

                {/* By Type */}
                {questionsData.summary.byType.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">By Type</Label>
                    <div className="space-y-1">
                      {questionsData.summary.byType.map((item) => (
                        <div key={item._id} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{item._id.replace('-', ' ')}</span>
                          <Badge variant="outline" className="text-xs">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Difficulty */}
                {questionsData.summary.byDifficulty.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">By Difficulty</Label>
                    <div className="space-y-1">
                      {questionsData.summary.byDifficulty.map((item) => (
                        <div key={item._id} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{item._id}</span>
                          <Badge 
                            variant={item._id === 'hard' ? 'destructive' : item._id === 'medium' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {item.count}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* By Section */}
                {questionsData.summary.bySection.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">By Section</Label>
                    <div className="space-y-1">
                      {questionsData.summary.bySection.map((item) => (
                        <div key={item._id} className="flex items-center justify-between text-sm">
                          <span>Section {item._id}</span>
                          <Badge variant="outline" className="text-xs">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Test Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <div className="flex items-center gap-2">
                  {getTypeIcon(test.type)}
                  <span className="capitalize">{test.type}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Duration</Label>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{formatDuration(test.duration)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant={test.isActive ? "default" : "secondary"}>
                  {test.isActive ? "Active" : "Draft"}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Content</Label>
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {test.questions?.length || 0} questions
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {test.totalPoints || 0} total points
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Created By</Label>
                <p className="text-sm">{test.createdBy?.firstName} {test.createdBy?.lastName}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm">{new Date(test.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm">{new Date(test.updatedAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Question Detail Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Question #{selectedQuestion?.questionNumber}</span>
              <div className="flex gap-2">
                {isEditingQuestion ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingQuestion(false);
                        setQuestionEditData(selectedQuestion || {});
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveQuestion}
                      disabled={savingQuestion}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {savingQuestion ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditQuestion}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Question</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this question? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteQuestion}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              {selectedQuestion && (
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{selectedQuestion.type}</Badge>
                  <Badge variant="outline">{selectedQuestion.subType}</Badge>
                  <Badge variant={selectedQuestion.difficulty === 'hard' ? 'destructive' : selectedQuestion.difficulty === 'medium' ? 'default' : 'secondary'}>
                    {selectedQuestion.difficulty}
                  </Badge>
                  <Badge variant="secondary">{selectedQuestion.points} points</Badge>
                  <Badge variant="outline">Section {selectedQuestion.section}</Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedQuestion && (
            <div className="space-y-4 mt-4">
              {isEditingQuestion ? (
                <>
                  {/* Edit Mode */}
                  <div className="space-y-2">
                    <Label>Question</Label>
                    <Textarea
                      value={questionEditData.question || ''}
                      onChange={(e) => setQuestionEditData({ ...questionEditData, question: e.target.value })}
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Points</Label>
                      <Input
                        type="number"
                        min="1"
                        value={questionEditData.points || 1}
                        onChange={(e) => setQuestionEditData({ ...questionEditData, points: parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select
                        value={questionEditData.difficulty || 'medium'}
                        onValueChange={(value: 'easy' | 'medium' | 'hard') => setQuestionEditData({ ...questionEditData, difficulty: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Section</Label>
                    <Select
                      value={questionEditData.section?.toString() || '1'}
                      onValueChange={(value) => setQuestionEditData({ ...questionEditData, section: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Section 1</SelectItem>
                        <SelectItem value="2">Section 2</SelectItem>
                        <SelectItem value="3">Section 3</SelectItem>
                        <SelectItem value="4">Section 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options editor */}
                  {selectedQuestion.subType?.includes('multiple-choice') && (
                    <div className="space-y-2">
                      <Label>Options</Label>
                      <div className="space-y-2">
                        {(questionEditData.options || []).map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                              {String.fromCharCode(65 + index)}
                            </div>
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              className="flex-1"
                            />
                            {(questionEditData.options?.length || 0) > 2 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveOption(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleAddOption}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label>Correct Answer</Label>
                        <Select
                          value={questionEditData.correctAnswer || ''}
                          onValueChange={(value) => setQuestionEditData({ ...questionEditData, correctAnswer: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select correct answer" />
                          </SelectTrigger>
                          <SelectContent>
                            {(questionEditData.options || []).map((option, index) => (
                              <SelectItem key={index} value={option}>
                                {String.fromCharCode(65 + index)}. {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {(questionEditData.tags || []).map((tag, index) => (
                        <Badge key={index} variant="outline" className="gap-1">
                          {tag}
                          <button
                            onClick={() => {
                              const newTags = [...(questionEditData.tags || [])];
                              newTags.splice(index, 1);
                              setQuestionEditData({ ...questionEditData, tags: newTags });
                            }}
                            className="hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* View Mode */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Question</Label>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedQuestion.question}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Type</Label>
                        <p className="text-sm capitalize">{selectedQuestion.type}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Sub Type</Label>
                        <p className="text-sm capitalize">{selectedQuestion.subType?.replace('-', ' ')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Points</Label>
                        <p className="text-sm">{selectedQuestion.points}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Difficulty</Label>
                        <Badge variant={selectedQuestion.difficulty === 'hard' ? 'destructive' : selectedQuestion.difficulty === 'medium' ? 'default' : 'secondary'}>
                          {selectedQuestion.difficulty}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Section</Label>
                        <p className="text-sm">Section {selectedQuestion.section}</p>
                      </div>
                    </div>

                    {selectedQuestion.options && selectedQuestion.options.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Options</Label>
                        <div className="space-y-2">
                          {selectedQuestion.options.map((option, index) => (
                            <div
                              key={index}
                              className={`flex items-center gap-2 p-3 rounded-lg border ${
                                option === selectedQuestion.correctAnswer
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-muted'
                              }`}
                            >
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                                {String.fromCharCode(65 + index)}
                              </div>
                              <span className="text-sm flex-1">{option}</span>
                              {option === selectedQuestion.correctAnswer && (
                                <Badge variant="default" className="bg-green-600">
                                  Correct
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedQuestion.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Marking Type</Label>
                      <Badge variant={selectedQuestion.markingType === 'auto' ? 'default' : 'secondary'}>
                        {selectedQuestion.markingType === 'auto' ? 'Auto-graded' : 'Manual grading'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant={selectedQuestion.isActive ? 'default' : 'secondary'}>
                        {selectedQuestion.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>
                          <p className="font-medium">Created by</p>
                          <p>{selectedQuestion.createdBy?.firstName} {selectedQuestion.createdBy?.lastName}</p>
                        </div>
                        <div>
                          <p className="font-medium">Created at</p>
                          <p>{new Date(selectedQuestion.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseQuestionDialog}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}