'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  BookOpen,
  Volume2,
  PenTool,
  Clock,
  Users,
  Play,
  FileText,
  CheckCircle2,
  X
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Test {
  _id: string;
  title: string;
  description: string;
  type: 'reading' | 'listening' | 'writing' | 'mixed';
  duration: number;
  isActive: boolean;
  questions: string[];
  passages: string[];
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

interface Question {
  _id: string;
  type: 'reading' | 'listening' | 'writing';
  subType: string;
  question: string;
  passage?: string;
  audioUrl?: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface Passage {
  _id: string;
  title: string;
  content: string;
  type: 'reading' | 'listening';
  audioUrl?: string;
  duration?: number;
  questions: Question[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

// Some APIs may return populated passages in tests; support both string ids and populated objects
type PopulatedPassageRef = { questions?: { _id: string }[] };
type TestMaybePopulated = Omit<Test, 'passages'> & { passages: (string | PopulatedPassageRef)[] };

const testTypes = [
  { value: 'reading', label: 'Reading', icon: BookOpen },
  { value: 'listening', label: 'Listening', icon: Volume2 },
  { value: 'writing', label: 'Writing', icon: PenTool },
  { value: 'mixed', label: 'Mixed', icon: Play },
];

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [passagesLoading, setPassagesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState<string>('all');
  const [selectedQuestionDifficulty, setSelectedQuestionDifficulty] = useState<string>('all');
  const [passageSearchTerm, setPassageSearchTerm] = useState('');
  const [selectedPassageType, setSelectedPassageType] = useState<string>('all');

  const [newTest, setNewTest] = useState({
    title: '',
    description: '',
    type: 'reading' as 'reading' | 'listening' | 'writing' | 'mixed',
    duration: 60,
    isActive: true,
    questions: [] as string[],
    passages: [] as string[],
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const data = await authService.apiRequest('/tests?page=1&limit=50');
      setTests(data.tests || []);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async () => {
    if (questions.length > 0) return; // Don't fetch if already loaded

    setQuestionsLoading(true);
    try {
      const data = await authService.apiRequest('/questions?page=1&limit=100');
      setQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const fetchPassages = async () => {
    if (passages.length > 0) return; // Don't fetch if already loaded

    setPassagesLoading(true);
    try {
      const data = await authService.apiRequest('/passages?page=1&limit=100');
      setPassages(data.passages || []);
    } catch (error) {
      console.error('Failed to fetch passages:', error);
    } finally {
      setPassagesLoading(false);
    }
  };

  const handleCreateTest = async () => {
    try {
      await authService.apiRequest('/tests', {
        method: 'POST',
        body: JSON.stringify({
          ...newTest,
          passages: newTest.passages,
          questions: newTest.questions,
        }),
      });

      setIsCreateDialogOpen(false);
      fetchTests();

      // Reset form
      setNewTest({
        title: '',
        description: '',
        type: 'reading',
        duration: 60,
        isActive: true,
        questions: [],
        passages: [],
      });
    } catch (error) {
      console.error('Failed to create test:', error);
    }
  };

  const toggleTestStatus = async (testId: string, currentStatus: boolean) => {
    try {
      await authService.apiRequest(`/tests/${testId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchTests();
    } catch (error) {
      console.error('Failed to update test status:', error);
    }
  };

  const handleQuestionToggle = (questionId: string, checked: boolean) => {
    if (checked) {
      setNewTest({
        ...newTest,
        questions: [...newTest.questions, questionId]
      });
    } else {
      setNewTest({
        ...newTest,
        questions: newTest.questions.filter(id => id !== questionId)
      });
    }
  };

  const handlePassageToggle = (passageId: string, checked: boolean) => {
    if (checked) {
      setNewTest({
        ...newTest,
        passages: [...newTest.passages, passageId]
      });
    } else {
      setNewTest({
        ...newTest,
        passages: newTest.passages.filter(id => id !== passageId)
      });
    }
  };

  const removeSelectedQuestion = (questionId: string) => {
    setNewTest({
      ...newTest,
      questions: newTest.questions.filter(id => id !== questionId)
    });
  };

  const removeSelectedPassage = (passageId: string) => {
    setNewTest({
      ...newTest,
      passages: newTest.passages.filter(id => id !== passageId)
    });
  };

  const getSelectedQuestions = () => {
    return questions.filter(q => newTest.questions.includes(q._id));
  };

  const getSelectedPassages = () => {
    return passages.filter(p => newTest.passages.includes(p._id));
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || !selectedType || test.type === selectedType;
    return matchesSearch && matchesType;
  });

  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question.toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
      question.tags.some(tag => tag.toLowerCase().includes(questionSearchTerm.toLowerCase()));
    const matchesType = selectedQuestionType === 'all' || question.type === selectedQuestionType;
    const matchesDifficulty = selectedQuestionDifficulty === 'all' || question.difficulty === selectedQuestionDifficulty;
    const matchesTestType = newTest.type === 'mixed' || question.type === newTest.type;
    return matchesSearch && matchesType && matchesDifficulty && matchesTestType;
  });

  const filteredPassages = passages.filter(passage => {
    const matchesSearch = passage.title.toLowerCase().includes(passageSearchTerm.toLowerCase()) ||
      passage.content?.toLowerCase().includes(passageSearchTerm.toLowerCase());
    const matchesType = selectedPassageType === 'all' || passage.type === selectedPassageType;
    const matchesTestType = newTest.type === 'mixed' || passage.type === newTest.type;
    return matchesSearch && matchesType && matchesTestType;
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

  const getTotalQuestionsForTest = (test: Test): number => {
    const baseQuestions = test.questions?.length || 0;
    // If passages are populated with questions, include them; otherwise 0
    const maybe = test as unknown as TestMaybePopulated;
    const extraFromPassages = Array.isArray(maybe.passages)
      ? maybe.passages.reduce((acc, p) => {
        if (p && typeof p === 'object' && 'questions' in p) {
          const qArr = (p as PopulatedPassageRef).questions || [];
          return acc + qArr.length;
        }
        return acc;
      }, 0)
      : 0;
    return baseQuestions + extraFromPassages;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tests</h2>
          <p className="text-muted-foreground">Create and manage IELTS tests</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { fetchQuestions(); fetchPassages(); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Test</DialogTitle>
              <DialogDescription>Create a new IELTS test for your students</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Test Title</Label>
                  <Input
                    placeholder="e.g., IELTS Reading Practice Test 1"
                    value={newTest.title}
                    onChange={(e) => setNewTest({ ...newTest, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    placeholder="Describe what this test covers..."
                    value={newTest.description}
                    onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Test Type</Label>
                    <Select value={newTest.type} onValueChange={(value: any) => setNewTest({ ...newTest, type: value })}>
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
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newTest.duration}
                      onChange={(e) => setNewTest({ ...newTest, duration: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={newTest.isActive}
                    onCheckedChange={(checked) => setNewTest({ ...newTest, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active (available for assignment)</Label>
                </div>

                {/* Selected Questions and Passages */}
                {(newTest.questions.length > 0 || newTest.passages.length > 0) && (
                  <div className="space-y-4">
                    {newTest.questions.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Questions ({newTest.questions.length})</Label>
                        <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                          <div className="space-y-2">
                            {getSelectedQuestions().map(question => (
                              <div key={question._id} className="flex items-center justify-between bg-accent/50 p-2 rounded">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{question.question}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {question.type} • {question.subType?.replace('-', ' ')} • {question.points} pts
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSelectedQuestion(question._id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {newTest.passages.length > 0 && (
                      <div className="space-y-2">
                        <Label>Selected Passages ({newTest.passages.length})</Label>
                        <div className="border rounded-md p-3 max-h-32 overflow-y-auto">
                          <div className="space-y-2">
                            {getSelectedPassages().map(passage => (
                              <div key={passage._id} className="flex items-center justify-between bg-accent/50 p-2 rounded">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate">{passage.title}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {passage.type} • {passage.questions?.length || 0} questions
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSelectedPassage(passage._id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Question and Passage Bank */}
                <div className="space-y-4">
                  <Label>Add Content from Banks</Label>

                  <Tabs defaultValue="questions" className="w-full">
                    <TabsList>
                      <TabsTrigger value="questions">Question Bank</TabsTrigger>
                      <TabsTrigger value="passages">Passage Bank</TabsTrigger>
                    </TabsList>

                    <TabsContent value="questions" className="space-y-4">
                      {/* Question Filters */}
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search questions..."
                            className="pl-8"
                            value={questionSearchTerm}
                            onChange={(e) => setQuestionSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select value={selectedQuestionType} onValueChange={setSelectedQuestionType}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="reading">Reading</SelectItem>
                            <SelectItem value="listening">Listening</SelectItem>
                            <SelectItem value="writing">Writing</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={selectedQuestionDifficulty} onValueChange={setSelectedQuestionDifficulty}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Questions List */}
                      <ScrollArea className="h-64 border rounded-md p-4">
                        {questionsLoading ? (
                          <div className="text-center py-8">Loading questions...</div>
                        ) : (
                          <div className="space-y-3">
                            {filteredQuestions.map((question) => (
                              <div key={question._id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50">
                                <Checkbox
                                  checked={newTest.questions.includes(question._id)}
                                  onCheckedChange={(checked) => handleQuestionToggle(question._id, checked as boolean)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getTypeIcon(question.type)}
                                    <Badge className={getDifficultyColor(question.difficulty)} variant="outline">
                                      {question.difficulty}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {question.points} pts
                                    </span>
                                  </div>
                                  <div className="text-sm font-medium mb-1">{question.question}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {question.subType?.replace('-', ' ')} • by {question.createdBy.firstName} {question.createdBy.lastName}
                                  </div>
                                  {question.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {question.tags.slice(0, 3).map((tag) => (
                                        <Badge key={tag} variant="secondary" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {question.tags.length > 3 && (
                                        <Badge variant="secondary" className="text-xs">
                                          +{question.tags.length - 3}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {filteredQuestions.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                No questions found matching your criteria
                              </div>
                            )}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="passages" className="space-y-4">
                      {/* Passage Filters */}
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search passages..."
                            className="pl-8"
                            value={passageSearchTerm}
                            onChange={(e) => setPassageSearchTerm(e.target.value)}
                          />
                        </div>
                        <Select value={selectedPassageType} onValueChange={setSelectedPassageType}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All types</SelectItem>
                            <SelectItem value="reading">Reading</SelectItem>
                            <SelectItem value="listening">Listening</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Passages List */}
                      <ScrollArea className="h-64 border rounded-md p-4">
                        {passagesLoading ? (
                          <div className="text-center py-8">Loading passages...</div>
                        ) : (
                          <div className="space-y-3">
                            {filteredPassages.map((passage) => (
                              <div key={passage._id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-accent/50">
                                <Checkbox
                                  checked={newTest.passages.includes(passage._id)}
                                  onCheckedChange={(checked) => handlePassageToggle(passage._id, checked as boolean)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    {getTypeIcon(passage.type)}
                                    <span className="text-xs text-muted-foreground">
                                      {passage.questions?.length || 0} questions
                                    </span>
                                    {passage.duration && (
                                      <span className="text-xs text-muted-foreground">
                                        • {formatDuration(passage.duration)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm font-medium mb-1">{passage.title}</div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {passage.content?.substring(0, 100)}...
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    by {passage.createdBy.firstName} {passage.createdBy.lastName}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {filteredPassages.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                No passages found matching your criteria
                              </div>
                            )}
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTest}
                disabled={!newTest.title || !newTest.description}
              >
                Create Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
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
        </CardContent>
      </Card>

      {/* Tests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tests ({filteredTests.length})</CardTitle>
          <CardDescription>
            Manage your IELTS test collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading tests...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTests.map((test) => (
                  <TableRow
                    key={test._id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/tests/${test._id}`)}
                  >
                    <TableCell className="max-w-xs">
                      <div className="font-medium">{test.title}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {test.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getTypeIcon(test.type)}
                        <span className="capitalize">{test.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatDuration(test.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {getTotalQuestionsForTest(test)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={test.isActive ? "default" : "secondary"}>
                          {test.isActive ? "Active" : "Draft"}
                        </Badge>
                        <Switch
                          checked={test.isActive}
                          onCheckedChange={() => toggleTestStatus(test._id, test.isActive)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(test.createdAt).toLocaleDateString()}
                      </div>
                      {test.createdBy && (
                        <div className="text-xs text-muted-foreground">
                          by {test.createdBy.firstName} {test.createdBy.lastName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/tests/${test._id}`);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}