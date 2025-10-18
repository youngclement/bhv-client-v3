'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye,
  BookOpen, 
  Volume2, 
  PenTool, 
  Play,
  Clock,
  FileText,
  Users,
  Search,
  Filter,
  Settings,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { authService } from '@/lib/auth';

interface Test {
  _id: string;
  title: string;
  description: string;
  type: 'reading' | 'listening' | 'writing' | 'full';
  duration: number;
  totalQuestions: number;
  totalPoints: number;
  isActive: boolean;
  status: 'draft' | 'published' | 'archived';
  questions: any[];
  sections: any[];
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
  type: 'reading' | 'listening' | 'writing';
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

export default function TestBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const testId = params.id as string;

  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionsData, setQuestionsData] = useState<QuestionsResponse | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [publishing, setPublishing] = useState(false);

  const fetchTest = useCallback(async (id: string) => {
    try {
      const data = await authService.apiRequest(`/tests/${id}`);
      setTest(data);
    } catch (error) {
      console.error('Failed to fetch test:', error);
    }
  }, []);

  const fetchQuestions = useCallback(async (id: string) => {
    try {
      const data = await authService.apiRequest(`/tests/${id}/questions/all`);
      setQuestionsData(data);
      setQuestions(data.questions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (testId) {
        setLoading(true);
        await Promise.all([
          fetchTest(testId),
          fetchQuestions(testId)
        ]);
        setLoading(false);
      }
    };
    loadData();
  }, [testId, fetchTest, fetchQuestions]);

  const handlePublishTest = async () => {
    if (!test) return;
    
    setPublishing(true);
    try {
      await authService.apiRequest(`/tests/${test._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'published' }),
      });
      
      await fetchTest(test._id);
      alert('Test published successfully!');
    } catch (error) {
      console.error('Failed to publish test:', error);
      alert('Failed to publish test. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    try {
      await authService.apiRequest(`/questions/${questionId}`, {
        method: 'DELETE',
      });
      
      await fetchQuestions(testId);
      alert('Question deleted successfully!');
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('Failed to delete question. Please try again.');
    }
  };

  const filteredQuestions = (questions || []).filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSection = selectedSection === 'all' || question.section.toString() === selectedSection;
    const matchesType = selectedType === 'all' || question.type === selectedType;
    const matchesDifficulty = selectedDifficulty === 'all' || question.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesSection && matchesType && matchesDifficulty;
  });

  const getTypeIcon = (type: string) => {
    const typeConfig = testTypes.find(t => t.value === type);
    return typeConfig ? <typeConfig.icon className="h-4 w-4" /> : null;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
          <p className="mt-2 text-sm text-muted-foreground">Loading test builder...</p>
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
      {/* Header */}
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
            <h2 className="text-3xl font-bold tracking-tight">Test Builder</h2>
            <p className="text-muted-foreground">Build and manage your test content</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/tests/${testId}`)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View Test
          </Button>
          {test.status === 'draft' && (
            <Button
              onClick={handlePublishTest}
              disabled={publishing || (questions || []).length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {publishing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Publish Test
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Test Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getTypeIcon(test.type)}
              <div>
                <CardTitle>{test.title}</CardTitle>
                <CardDescription>
                  {test.type.charAt(0).toUpperCase() + test.type.slice(1)} Test • {formatDuration(test.duration)}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  test.status === 'published' ? "default" : 
                  test.status === 'draft' ? "secondary" : 
                  "outline"
                }
                className={
                  test.status === 'published' ? 'bg-green-100 text-green-800' :
                  test.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }
              >
                {test.status === 'draft' ? 'Draft' : 
                 test.status === 'published' ? 'Published' : 
                 'Archived'}
              </Badge>
              <Switch
                checked={test.isActive}
                disabled={test.status === 'draft'}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{(questions || []).length}</div>
              <div className="text-xs text-muted-foreground">Total Questions</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {questionsData?.summary.bySection.reduce((sum, item) => sum + item.totalPoints, 0) || 0}
              </div>
              <div className="text-xs text-muted-foreground">Total Points</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {questionsData?.summary.bySection.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Sections</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{formatDuration(test.duration)}</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions Management</CardTitle>
                  <CardDescription>
                    Manage questions for your test
                  </CardDescription>
                </div>
                <Button
                  onClick={() => router.push(`/dashboard/tests/${testId}/question/create`)}
                  className="bg-[#004875] hover:bg-[#003a5c]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Section" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sections</SelectItem>
                    <SelectItem value="1">Section 1</SelectItem>
                    <SelectItem value="2">Section 2</SelectItem>
                    <SelectItem value="3">Section 3</SelectItem>
                    <SelectItem value="4">Section 4</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="listening">Listening</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Questions Table */}
              {filteredQuestions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.map((question) => (
                      <TableRow key={question._id}>
                        <TableCell className="max-w-xs">
                          <div className="font-medium truncate">{question.question}</div>
                          <div className="text-sm text-muted-foreground">
                            {question.subType?.replace('-', ' ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(question.type)}
                            <span className="capitalize text-sm">{question.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            Section {question.section}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getDifficultyColor(question.difficulty)}`}
                          >
                            {question.difficulty}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {question.points} pts
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/tests/${testId}/question/${question._id}/edit`)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
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
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteQuestion(question._id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="space-y-2">
                    <p>No questions found</p>
                    <Button
                      onClick={() => router.push(`/dashboard/tests/${testId}/question/create`)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Question
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Test Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Test Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Badge 
                  variant={
                    test.status === 'published' ? "default" : 
                    test.status === 'draft' ? "secondary" : 
                    "outline"
                  }
                  className={
                    test.status === 'published' ? 'bg-green-100 text-green-800' :
                    test.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }
                >
                  {test.status === 'draft' ? 'Draft' : 
                   test.status === 'published' ? 'Published' : 
                   'Archived'}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Type</Label>
                <div className="flex items-center gap-2">
                  {getTypeIcon(test.type)}
                  <span className="capitalize text-sm">{test.type}</span>
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
                <Label className="text-sm font-medium">Created By</Label>
                <p className="text-sm">{test.createdBy?.firstName} {test.createdBy?.lastName}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm">{new Date(test.createdAt).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/dashboard/tests/${testId}/question/create`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push(`/dashboard/tests/${testId}`)}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Test
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/tests')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tests
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
